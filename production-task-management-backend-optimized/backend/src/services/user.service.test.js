```javascript
const httpStatus = require('http-status');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const prisma = require('../db/prisma'); // The mocked prisma client from jest.setup.js
const { hashPassword } = require('../utils/bcrypt');
const { invalidateCache } = require('../middlewares/cache');

// Mock specific internal functions if needed
jest.mock('../utils/bcrypt', () => ({
  hashPassword: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  comparePassword: jest.fn(),
}));

jest.mock('../middlewares/cache', () => ({
  invalidateCache: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should create a new user if email is not taken', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      const createdUser = {
        id: 'mock-uuid-1',
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: 'USER',
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(null); // Email not taken
      prisma.user.create.mockResolvedValue(createdUser);

      const result = await userService.createUser(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(hashPassword).toHaveBeenCalledWith(userData.password);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          ...userData,
          password: `hashed_${userData.password}`,
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(createdUser);
      expect(invalidateCache).toHaveBeenCalledWith('users');
    });

    it('should throw ApiError if email is already taken', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'Existing',
        lastName: 'User',
      };

      prisma.user.findUnique.mockResolvedValue({ id: 'existing-id' }); // Email already taken

      await expect(userService.createUser(userData)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should return a user if found', async () => {
      const userId = 'some-uuid';
      const user = {
        id: userId,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
        createdAt: new Date(),
      };
      prisma.user.findUnique.mockResolvedValue(user);

      const result = await userService.getUserById(userId);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: expect.any(Object),
      });
      expect(result).toEqual(user);
    });

    it('should return null if user not found', async () => {
      const userId = 'non-existent-uuid';
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await userService.getUserById(userId);
      expect(result).toBeNull();
    });
  });

  describe('updateUserById', () => {
    it('should update user details', async () => {
      const userId = 'some-uuid';
      const originalUser = {
        id: userId,
        email: 'original@example.com',
        firstName: 'Original',
        lastName: 'User',
        role: 'USER',
      };
      const updateBody = {
        firstName: 'Updated',
        email: 'updated@example.com',
      };
      const updatedUser = { ...originalUser, ...updateBody };

      prisma.user.findUnique.mockResolvedValueOnce(originalUser); // for initial check
      prisma.user.findUnique.mockResolvedValueOnce(null); // for email check (no conflict)
      prisma.user.update.mockResolvedValue(updatedUser);

      const result = await userService.updateUserById(userId, updateBody);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: updateBody,
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
      expect(invalidateCache).toHaveBeenCalledWith('users');
    });

    it('should throw ApiError if user not found', async () => {
      const userId = 'non-existent-uuid';
      const updateBody = { firstName: 'Updated' };
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.updateUserById(userId, updateBody)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(invalidateCache).not.toHaveBeenCalled();
    });

    it('should throw ApiError if new email is already taken', async () => {
      const userId = 'some-uuid';
      const originalUser = { id: userId, email: 'original@example.com' };
      const updateBody = { email: 'taken@example.com' };
      prisma.user.findUnique.mockResolvedValueOnce(originalUser); // for initial check
      prisma.user.findUnique.mockResolvedValueOnce({ id: 'other-user-id' }); // for email check (conflict)

      await expect(userService.updateUserById(userId, updateBody)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(invalidateCache).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserById', () => {
    it('should delete a user', async () => {
      const userId = 'some-uuid';
      const userToDelete = { id: userId, email: 'to_delete@example.com' };
      prisma.user.findUnique.mockResolvedValue(userToDelete);
      prisma.user.delete.mockResolvedValue(userToDelete);

      const result = await userService.deleteUserById(userId);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result).toEqual({ message: 'User deleted successfully' });
      expect(invalidateCache).toHaveBeenCalledWith('users');
    });

    it('should throw ApiError if user not found', async () => {
      const userId = 'non-existent-uuid';
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.deleteUserById(userId)).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
      expect(invalidateCache).not.toHaveBeenCalled();
    });
  });
});
```