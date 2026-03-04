```typescript
import { prisma } from '../config/prisma';
import * as userService from './userService';

// Mock prisma client for isolation
jest.mock('../config/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('userService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should return user profile if found', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const user = await userService.getUserProfile('user1');
      expect(user).toEqual({
        id: 'user1',
        username: 'testuser',
        email: 'test@example.com',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user1' },
        select: expect.any(Object),
      });
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(userService.getUserProfile('nonexistent')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      const updatedData = { username: 'newusername', email: 'new@example.com' };
      const mockUpdatedUser = {
        id: 'user1',
        ...updatedData,
        updatedAt: new Date(),
      };
      mockPrisma.user.update.mockResolvedValue(mockUpdatedUser);

      const user = await userService.updateUserProfile('user1', updatedData);
      expect(user).toEqual(mockUpdatedUser);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: updatedData,
        select: expect.any(Object),
      });
    });

    it('should throw error if username or email already exists', async () => {
      const error = new Error('Unique constraint violation');
      (error as any).code = 'P2002';
      mockPrisma.user.update.mockRejectedValue(error);

      await expect(userService.updateUserProfile('user1', { username: 'existing' })).rejects.toThrow('Username or email already exists.');
    });
  });

  describe('getAllUsers', () => {
    it('should return a list of all users', async () => {
      const mockUsers = [
        { id: 'u1', username: 'alice', email: 'alice@example.com' },
        { id: 'u2', username: 'bob', email: 'bob@example.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const users = await userService.getAllUsers();
      expect(users).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { username: 'asc' },
      });
    });

    it('should throw an error if fetching users fails', async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error('DB error'));
      await expect(userService.getAllUsers()).rejects.toThrow('Could not fetch users');
    });
  });
});
```