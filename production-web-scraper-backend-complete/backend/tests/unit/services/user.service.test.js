const userService = require('../../../src/services/user.service');
const { User } = require('../../../src/db/models');
const ApiError = require('../../../src/utils/ApiError');
const httpStatus = require('http-status');

// Mock the User model methods
jest.mock('../../../src/db/models', () => ({
  User: {
    create: jest.fn(),
    isEmailTaken: jest.fn(),
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAndCountAll: jest.fn(),
    prototype: {
      save: jest.fn(),
      destroy: jest.fn(),
      toJSON: jest.fn(function () { return { ...this.get(), password: '[HIDDEN]' }; }), // Mimic toJSON excluding password
      get: jest.fn(function () { return this; }), // Mimic get method to return current instance
    },
  },
}));

describe('User Service', () => {
  let newUser;
  let mockUserInstance;

  beforeEach(() => {
    newUser = {
      id: 'test-user-id-1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockUserInstance = {
      ...newUser,
      isPasswordMatch: jest.fn(),
      save: jest.fn().mockResolvedValue(true),
      destroy: jest.fn().mockResolvedValue(true),
      toJSON: jest.fn().mockReturnValue(newUser), // Mock toJSON for instances
      get: jest.fn().mockReturnValue(newUser),
    };

    // Reset all mocks before each test
    for (const key in User) {
      if (typeof User[key] === 'function') {
        User[key].mockReset();
      }
    }
    for (const key in User.prototype) {
      if (typeof User.prototype[key] === 'function') {
        User.prototype[key].mockReset();
      }
    }
  });

  describe('createUser', () => {
    test('should create a user successfully if email is not taken', async () => {
      User.isEmailTaken.mockResolvedValue(false);
      User.create.mockResolvedValue(mockUserInstance);

      const user = await userService.createUser(newUser);

      expect(User.isEmailTaken).toHaveBeenCalledWith(newUser.email);
      expect(User.create).toHaveBeenCalledWith(newUser);
      expect(user).toEqual(mockUserInstance);
    });

    test('should throw ApiError if email is already taken', async () => {
      User.isEmailTaken.mockResolvedValue(true);

      await expect(userService.createUser(newUser)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
      expect(User.isEmailTaken).toHaveBeenCalledWith(newUser.email);
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('queryUsers', () => {
    test('should return users with pagination and sorting', async () => {
      const mockResult = {
        count: 1,
        rows: [mockUserInstance],
      };
      User.findAndCountAll.mockResolvedValue(mockResult);

      const filter = { role: 'user' };
      const options = { limit: 10, page: 1, sortBy: 'createdAt:desc' };

      const result = await userService.queryUsers(filter, options);

      expect(User.findAndCountAll).toHaveBeenCalledWith({
        where: filter,
        limit: options.limit,
        offset: 0,
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password'] }
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserById', () => {
    test('should return a user if found', async () => {
      User.findByPk.mockResolvedValue(mockUserInstance);

      const user = await userService.getUserById(newUser.id);

      expect(User.findByPk).toHaveBeenCalledWith(newUser.id, { attributes: { exclude: ['password'] } });
      expect(user).toEqual(mockUserInstance);
    });

    test('should throw ApiError if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.getUserById('non-existent-id')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
      expect(User.findByPk).toHaveBeenCalledWith('non-existent-id', { attributes: { exclude: ['password'] } });
    });
  });

  describe('getUserByEmail', () => {
    test('should return a user if found by email', async () => {
      User.findOne.mockResolvedValue(mockUserInstance);

      const user = await userService.getUserByEmail(newUser.email);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: newUser.email } });
      expect(user).toEqual(mockUserInstance);
    });

    test('should return null if user not found by email', async () => {
      User.findOne.mockResolvedValue(null);

      const user = await userService.getUserByEmail('nonexistent@example.com');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'nonexistent@example.com' } });
      expect(user).toBeNull();
    });
  });

  describe('updateUserById', () => {
    test('should update user successfully', async () => {
      User.findByPk.mockResolvedValue(mockUserInstance);
      User.isEmailTaken.mockResolvedValue(false); // New email not taken

      const updateBody = { name: 'Updated Name' };
      const updatedUser = await userService.updateUserById(newUser.id, updateBody);

      expect(User.findByPk).toHaveBeenCalledWith(newUser.id, { attributes: { exclude: ['password'] } });
      expect(mockUserInstance.save).toHaveBeenCalled();
      expect(updatedUser.name).toBe(updateBody.name);
    });

    test('should throw ApiError if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.updateUserById('non-existent-id', { name: 'New Name' })).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
      expect(User.findByPk).toHaveBeenCalledWith('non-existent-id', { attributes: { exclude: ['password'] } });
    });

    test('should throw ApiError if new email is taken by another user', async () => {
      User.findByPk.mockResolvedValue(mockUserInstance);
      User.isEmailTaken.mockResolvedValue(true); // New email taken by another user

      const updateBody = { email: 'another@example.com' };

      await expect(userService.updateUserById(newUser.id, updateBody)).rejects.toThrow(
        new ApiError(httpStatus.BAD_REQUEST, 'Email already taken')
      );
      expect(User.findByPk).toHaveBeenCalledWith(newUser.id, { attributes: { exclude: ['password'] } });
      expect(User.isEmailTaken).toHaveBeenCalledWith(updateBody.email, newUser.id);
      expect(mockUserInstance.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteUserById', () => {
    test('should delete user successfully', async () => {
      User.findByPk.mockResolvedValue(mockUserInstance);

      const deletedUser = await userService.deleteUserById(newUser.id);

      expect(User.findByPk).toHaveBeenCalledWith(newUser.id, { attributes: { exclude: ['password'] } });
      expect(mockUserInstance.destroy).toHaveBeenCalled();
      expect(deletedUser).toEqual(mockUserInstance);
    });

    test('should throw ApiError if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(userService.deleteUserById('non-existent-id')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'User not found')
      );
      expect(User.findByPk).toHaveBeenCalledWith('non-existent-id', { attributes: { exclude: ['password'] } });
    });
  });
});