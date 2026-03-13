```typescript
import { AppDataSource } from '../../../src/database/data-source';
import { User } from '../../../src/database/entities/User';
import { CustomError } from '../../../src/utils/errors';
import * as userService from '../../../src/services/user.service';
import { Repository } from 'typeorm';
import { UserRole } from '../../../src/types/enums';

// Mock TypeORM repository
const mockUserRepository: Partial<Repository<User>> = {
  find: jest.fn(),
  findOne: jest.fn(), // For findUserById
  findOneBy: jest.fn(), // For updateUserRole and deleteUser
  save: jest.fn(),
  remove: jest.fn(),
};

// Mock AppDataSource to return the mocked repository
jest.mock('../../../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn(() => mockUserRepository),
  },
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllUsers', () => {
    it('should return all users with sensitive data excluded', async () => {
      const users = [
        { id: 'u1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN, password: 'hashed' },
        { id: 'u2', username: 'user', email: 'user@example.com', role: UserRole.USER, password: 'hashed' },
      ] as User[];
      (mockUserRepository.find as jest.Mock).mockResolvedValue(users);

      const result = await userService.findAllUsers();

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        select: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual([
        { id: 'u1', username: 'admin', email: 'admin@example.example.com', role: UserRole.ADMIN },
        { id: 'u2', username: 'user', email: 'user@example.com', role: UserRole.USER },
      ]);
    });
  });

  describe('findUserById', () => {
    it('should return a user if found, excluding sensitive data', async () => {
      const user = { id: 'u1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN, password: 'hashed' } as User;
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(user);

      const result = await userService.findUserById('u1');

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'u1' },
        select: ['id', 'username', 'email', 'role', 'createdAt', 'updatedAt'],
      });
      expect(result).toEqual({ id: 'u1', username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN });
    });

    it('should throw CustomError if user not found', async () => {
      (mockUserRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(userService.findUserById('nonexistent')).rejects.toThrow(
        new CustomError('User with ID nonexistent not found', 404)
      );
    });
  });

  describe('updateUserRole', () => {
    it('should update a user\'s role and return updated user', async () => {
      const userId = 'u1';
      const newRole = UserRole.USER;
      const existingUser = { id: userId, username: 'admin', email: 'admin@example.com', role: UserRole.ADMIN, password: 'hashed' } as User;
      const updatedUser = { ...existingUser, role: newRole };

      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(existingUser);
      (mockUserRepository.save as jest.Mock).mockResolvedValue(updatedUser);

      const result = await userService.updateUserRole(userId, newRole);

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: userId, role: newRole }));
      expect(result).toEqual({ id: userId, username: 'admin', email: 'admin@example.com', role: newRole });
    });

    it('should throw CustomError if user to update not found', async () => {
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(userService.updateUserRole('nonexistent', UserRole.ADMIN)).rejects.toThrow(
        new CustomError('User with ID nonexistent not found', 404)
      );
    });
  });

  describe('deleteUser', () => {
    it('should delete a user if found', async () => {
      const userId = 'u1';
      const userToDelete = { id: userId, username: 'user', email: 'user@example.com', role: UserRole.USER, password: 'hashed' } as User;
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(userToDelete);
      (mockUserRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await expect(userService.deleteUser(userId)).resolves.toBeUndefined();

      expect(mockUserRepository.findOneBy).toHaveBeenCalledWith({ id: userId });
      expect(mockUserRepository.remove).toHaveBeenCalledWith(userToDelete);
    });

    it('should throw CustomError if user to delete not found', async () => {
      (mockUserRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow(
        new CustomError('User with ID nonexistent not found', 404)
      );
    });
  });
});
```