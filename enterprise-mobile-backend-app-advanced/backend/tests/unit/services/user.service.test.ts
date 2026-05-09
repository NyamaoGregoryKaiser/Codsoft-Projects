import * as userService from '../../../src/modules/users/user.service';
import prisma from '../../../src/config/database';
import * as passwordUtils from '../../../src/utils/password';
import { ApiError } from '../../../src/middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@prisma/client';

// Mock Prisma client and password utils
jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback({
    user: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));
jest.mock('../../../src/utils/password');

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockPasswordUtils = passwordUtils as jest.Mocked<typeof passwordUtils>;

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: UserRole.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // --- Create User ---
  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPasswordUtils.hashPassword.mockResolvedValue('newHashedPassword');
      mockPrisma.user.create.mockResolvedValue({ ...mockUser, password: 'newHashedPassword' });

      const newUser = await userService.createUser({
        email: 'new@example.com',
        password: 'newPassword123',
        name: 'New User',
        role: UserRole.USER,
      });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('newPassword123');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          password: 'newHashedPassword',
          name: 'New User',
          role: UserRole.USER,
        },
      });
      expect(newUser).toEqual({ ...mockUser, password: 'newHashedPassword' });
    });

    it('should throw ApiError if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await expect(userService.createUser({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      })).rejects.toThrow(new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered'));
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // --- Get All Users ---
  describe('getAllUsers', () => {
    it('should return all users with pagination meta', async () => {
      const users = [{ ...mockUser, password: '' }]; // Exclude password from returned data
      const total = 1;
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            findMany: jest.fn().mockResolvedValue(users),
            count: jest.fn().mockResolvedValue(total),
          },
        };
        return Promise.all([
          (tx.user.findMany as jest.MockedFunction<typeof prisma.user.findMany>)(),
          (tx.user.count as jest.MockedFunction<typeof prisma.user.count>)(),
        ]);
      });

      const result = await userService.getAllUsers(0, 10);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      // Ensure findMany and count are called within the transaction context
      const findManyCall = (mockPrisma.$transaction as jest.Mock).mock.calls[0][0];
      const tx = await findManyCall({ user: { findMany: jest.fn(), count: jest.fn() } });
      expect(tx[0]).toEqual(users);
      expect(tx[1]).toEqual(total);

      expect(result.users).toEqual(users);
      expect(result.meta).toEqual({
        total: total,
        limit: 10,
        offset: 0,
        page: 1,
        pages: 1,
      });
    });
  });

  // --- Get User By Id ---
  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const userWithoutPassword = { ...mockUser, password: '' };
      mockPrisma.user.findUnique.mockResolvedValue(userWithoutPassword);

      const user = await userService.getUserById(mockUser.id);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        select: { id: true, email: true, name: true, role: true, createdAt: true, updatedAt: true },
      });
      expect(user).toEqual(userWithoutPassword);
    });

    it('should throw ApiError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id')).rejects.toThrow(
        new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      );
    });
  });

  // --- Update User By Id ---
  describe('updateUserById', () => {
    it('should update a user by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPasswordUtils.hashPassword.mockResolvedValue('newHashedPassword');
      const updatedUser = { ...mockUser, name: 'Updated Name', password: 'newHashedPassword' };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserById(mockUser.id, { name: 'Updated Name', password: 'newPassword' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('newPassword');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { name: 'Updated Name', password: 'newHashedPassword' },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw ApiError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.updateUserById('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      );
    });

    it('should throw ApiError if new email is already taken', async () => {
      const otherUser = { ...mockUser, id: 'other-id', email: 'other@example.com' };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // User to update exists
        .mockResolvedValueOnce(otherUser); // Other user exists with new email

      await expect(userService.updateUserById(mockUser.id, { email: 'other@example.com' })).rejects.toThrow(
        new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered')
      );
    });
  });

  // --- Delete User By Id ---
  describe('deleteUserById', () => {
    it('should delete a user by ID', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.delete.mockResolvedValue(mockUser);

      await userService.deleteUserById(mockUser.id);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUser.id } });
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: mockUser.id } });
    });

    it('should throw ApiError if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUserById('non-existent-id')).rejects.toThrow(
        new ApiError(StatusCodes.NOT_FOUND, 'User not found')
      );
      expect(mockPrisma.user.delete).not.toHaveBeenCalled();
    });
  });
});