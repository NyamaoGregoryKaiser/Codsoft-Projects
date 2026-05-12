```javascript
const userService = require('../../services/user.service');
const { User } = require('../../models');
const ApiError = require('../../utils/ApiError');
const httpStatus = require('http-status-codes');

// Mock User model interactions
jest.mock('../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
    findAndCountAll: jest.fn(),
    destroy: jest.fn(),
  },
}));

describe('User Service Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    test('should successfully create a user if email and username are not taken', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({ id: 'new-user-id', username: 'newUser', email: 'new@example.com', role: 'viewer' });

      const newUser = await userService.createUser({
        username: 'newUser',
        email: 'new@example.com',
        password: 'password123',
      });

      expect(newUser).toBeDefined();
      expect(newUser.username).toBe('newUser');
      expect(User.findOne).toHaveBeenCalledTimes(2); // Check for email and username
      expect(User.create).toHaveBeenCalledTimes(1);
    });

    test('should throw ApiError if email is already taken', async () => {
      User.findOne.mockImplementation((options) => {
        if (options.where.email === 'taken@example.com') {
          return Promise.resolve({ id: 'existing-id', email: 'taken@example.com' });
        }
        return Promise.resolve(null);
      });

      await expect(
        userService.createUser({
          username: 'uniqueUser',
          email: 'taken@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ApiError);
      await expect(
        userService.createUser({
          username: 'uniqueUser',
          email: 'taken@example.com',
          password: 'password123',
        })
      ).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(
        userService.createUser({
          username: 'uniqueUser',
          email: 'taken@example.com',
          password: 'password123',
        })
      ).rejects.toHaveProperty('message', 'Email already taken');
      expect(User.create).not.toHaveBeenCalled();
    });

    test('should throw ApiError if username is already taken', async () => {
      User.findOne.mockImplementation((options) => {
        if (options.where.username === 'takenUser') {
          return Promise.resolve({ id: 'existing-id', username: 'takenUser' });
        }
        return Promise.resolve(null);
      });

      await expect(
        userService.createUser({
          username: 'takenUser',
          email: 'new@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ApiError);
      await expect(
        userService.createUser({
          username: 'takenUser',
          email: 'new@example.com',
          password: 'password123',
        })
      ).rejects.toHaveProperty('statusCode', httpStatus.BAD_REQUEST);
      await expect(
        userService.createUser({
          username: 'takenUser',
          email: 'new@example.com',
          password: 'password123',
        })
      ).rejects.toHaveProperty('message', 'Username already taken');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    test('should return user if found', async () => {
      const mockUser = { id: 'user-id-1', username: 'user1' };
      User.findByPk.mockResolvedValue(mockUser);

      const user = await userService.getUserById('user-id-1');
      expect(user).toEqual(mockUser);
      expect(User.findByPk).toHaveBeenCalledWith('user-id-1');
    });

    test('should return null if user not found', async () => {
      User.findByPk.mockResolvedValue(null);
      const user = await userService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });
  });

  describe('updateUserById', () => {
    test('should update user successfully', async () => {
      const mockUser = {
        id: 'user-to-update',
        username: 'oldUser',
        email: 'old@example.com',
        role: 'viewer',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockResolvedValue(null); // No email/username collision

      const updatedUser = await userService.updateUserById('user-to-update', {
        username: 'updatedUser',
        email: 'updated@example.com',
      });

      expect(updatedUser.username).toBe('updatedUser');
      expect(updatedUser.email).toBe('updated@example.com');
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    test('should throw ApiError if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        userService.updateUserById('non-existent-id', { username: 'new' })
      ).rejects.toThrow(ApiError);
      await expect(
        userService.updateUserById('non-existent-id', { username: 'new' })
      ).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });

    test('should throw ApiError if updated email is taken by another user', async () => {
      const mockUser = {
        id: 'user-to-update',
        username: 'oldUser',
        email: 'old@example.com',
        role: 'viewer',
        save: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);
      User.findOne.mockImplementation((options) => {
        if (options.where.email === 'taken@example.com') {
          return Promise.resolve({ id: 'another-user', email: 'taken@example.com' });
        }
        return Promise.resolve(null);
      });

      await expect(
        userService.updateUserById('user-to-update', { email: 'taken@example.com' })
      ).rejects.toThrow(ApiError);
      await expect(
        userService.updateUserById('user-to-update', { email: 'taken@example.com' })
      ).rejects.toHaveProperty('message', 'Email already taken');
      expect(mockUser.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserById', () => {
    test('should delete user successfully', async () => {
      const mockUser = {
        id: 'user-to-delete',
        username: 'userToDelete',
        destroy: jest.fn().mockResolvedValue(true),
      };
      User.findByPk.mockResolvedValue(mockUser);

      const deletedUser = await userService.deleteUserById('user-to-delete');
      expect(deletedUser).toEqual(mockUser);
      expect(mockUser.destroy).toHaveBeenCalledTimes(1);
    });

    test('should throw ApiError if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        userService.deleteUserById('non-existent-id')
      ).rejects.toThrow(ApiError);
      await expect(
        userService.deleteUserById('non-existent-id')
      ).rejects.toHaveProperty('statusCode', httpStatus.NOT_FOUND);
    });
  });
});
```