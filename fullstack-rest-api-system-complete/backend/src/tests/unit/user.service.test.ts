import { UserService } from '../../services/user.service';
import { AppDataSource } from '../../config/database';
import { User, UserRole } from '../../models/User.entity';
import { HttpException } from '../../utils/http-exception';

// Mock TypeORM Repository
const mockUserRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
};

// Mock AppDataSource to return our mock repository
jest.mock('../../config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
    initialize: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;

  beforeAll(() => {
    userService = new UserService();
  });

  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('findAllUsers', () => {
    it('should return all users', async () => {
      const users = [
        { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() },
        { id: '2', email: 'admin1@example.com', firstName: 'Admin', lastName: 'One', role: UserRole.ADMIN, createdAt: new Date(), updatedAt: new Date() },
      ];
      mockUserRepository.find.mockResolvedValue(users);

      const result = await userService.findAllUsers();
      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
      });
    });

    it('should throw 500 HttpException on database error', async () => {
      mockUserRepository.find.mockRejectedValue(new Error('DB error'));
      await expect(userService.findAllUsers()).rejects.toThrow(HttpException);
      await expect(userService.findAllUsers()).rejects.toHaveProperty('status', 500);
    });
  });

  describe('findUserById', () => {
    it('should return a user if found', async () => {
      const user = { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One', role: UserRole.USER, createdAt: new Date(), updatedAt: new Date() };
      mockUserRepository.findOne.mockResolvedValue(user);

      const result = await userService.findUserById('1');
      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
        select: ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt', 'updatedAt'],
      });
    });

    it('should throw 404 HttpException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      await expect(userService.findUserById('nonexistent')).rejects.toThrow(HttpException);
      await expect(userService.findUserById('nonexistent')).rejects.toHaveProperty('status', 404);
    });

    it('should throw 500 HttpException on database error', async () => {
      mockUserRepository.findOne.mockRejectedValue(new Error('DB error'));
      await expect(userService.findUserById('1')).rejects.toThrow(HttpException);
      await expect(userService.findUserById('1')).rejects.toHaveProperty('status', 500);
    });
  });

  describe('updateUser', () => {
    it('should update a user successfully', async () => {
      const existingUser = { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One', role: UserRole.USER, password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      const updateData = { firstName: 'Updated', email: 'updated@example.com' };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findOneBy.mockResolvedValue(existingUser);
      mockUserRepository.findOne.mockResolvedValue(null); // New email is unique
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('1', updateData);
      expect(result).toEqual({ id: updatedUser.id, email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName, role: updatedUser.role });
      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining(updatedUser));
    });

    it('should throw 404 HttpException if user to update not found', async () => {
      mockUserRepository.findOneBy.mockResolvedValue(null);
      await expect(userService.updateUser('nonexistent', { firstName: 'Test' })).rejects.toThrow(HttpException);
      await expect(userService.updateUser('nonexistent', { firstName: 'Test' })).rejects.toHaveProperty('status', 404);
    });

    it('should throw 409 HttpException if new email is already in use by another user', async () => {
      const existingUser = { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One', role: UserRole.USER, password: 'hashed' };
      const conflictingUser = { id: '2', email: 'other@example.com', firstName: 'Other', lastName: 'User', role: UserRole.USER, password: 'hashed' };
      const updateData = { email: 'other@example.com' };

      mockUserRepository.findOneBy.mockResolvedValue(existingUser);
      mockUserRepository.findOne.mockResolvedValue(conflictingUser); // Email already exists for another user

      await expect(userService.updateUser('1', updateData)).rejects.toThrow(HttpException);
      await expect(userService.updateUser('1', updateData)).rejects.toHaveProperty('status', 409);
    });

    it('should not throw 409 HttpException if email is updated to its current value', async () => {
      const existingUser = { id: '1', email: 'user1@example.com', firstName: 'User', lastName: 'One', role: UserRole.USER, password: 'hashed', createdAt: new Date(), updatedAt: new Date() };
      const updateData = { email: 'user1@example.com', firstName: 'Updated' };
      const updatedUser = { ...existingUser, ...updateData };

      mockUserRepository.findOneBy.mockResolvedValue(existingUser);
      mockUserRepository.findOne.mockResolvedValue(existingUser); // Check for existing email finds current user
      mockUserRepository.save.mockResolvedValue(updatedUser);

      const result = await userService.updateUser('1', updateData);
      expect(result).toEqual({ id: updatedUser.id, email: updatedUser.email, firstName: updatedUser.firstName, lastName: updatedUser.lastName, role: updatedUser.role });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { email: 'user1@example.com' } });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining(updatedUser));
    });

    it('should throw 500 HttpException on database error', async () => {
      mockUserRepository.findOneBy.mockResolvedValue({ id: '1', email: 'user1@example.com' });
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.save.mockRejectedValue(new Error('DB error'));

      await expect(userService.updateUser('1', { firstName: 'Test' })).rejects.toThrow(HttpException);
      await expect(userService.updateUser('1', { firstName: 'Test' })).rejects.toHaveProperty('status', 500);
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 1 });
      await userService.deleteUser('1');
      expect(mockUserRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw 404 HttpException if user to delete not found', async () => {
      mockUserRepository.delete.mockResolvedValue({ affected: 0 });
      await expect(userService.deleteUser('nonexistent')).rejects.toThrow(HttpException);
      await expect(userService.deleteUser('nonexistent')).rejects.toHaveProperty('status', 404);
    });

    it('should throw 500 HttpException on database error', async () => {
      mockUserRepository.delete.mockRejectedValue(new Error('DB error'));
      await expect(userService.deleteUser('1')).rejects.toThrow(HttpException);
      await expect(userService.deleteUser('1')).rejects.toHaveProperty('status', 500);
    });
  });
});