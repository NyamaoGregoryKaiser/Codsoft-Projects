```javascript
const userService = require('../../services/userService');
const User = require('../../models/User');
const ErrorResponse = require('../../utils/errorResponse');
const logger = require('../../config/winston'); // Mock logger for tests

// Mock User model
jest.mock('../../models/User', () => ({
  find: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
  })),
  findById: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
  })),
  findByIdAndUpdate: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
  })),
  findByIdAndRemove: jest.fn(),
  prototype: {
    deleteOne: jest.fn(), // Mock for the instance method used by deleteUser
  }
}));

// Mock logger to prevent actual logging during tests
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();


describe('userService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- getAllUsers tests ---
  describe('getAllUsers', () => {
    it('should return all users', async () => {
      const mockUsers = [{ _id: '1', username: 'Alice' }, { _id: '2', username: 'Bob' }];
      User.find().select.mockResolvedValue(mockUsers);

      const users = await userService.getAllUsers();
      expect(User.find).toHaveBeenCalled();
      expect(User.find().select).toHaveBeenCalledWith('-password -__v');
      expect(users).toEqual(mockUsers);
      expect(logger.debug).toHaveBeenCalledWith('Fetched all users.');
    });
  });

  // --- getUserById tests ---
  describe('getUserById', () => {
    it('should return a user by ID', async () => {
      const mockUser = { _id: '1', username: 'Alice', email: 'alice@example.com' };
      User.findById().select.mockResolvedValue(mockUser);

      const user = await userService.getUserById('1');
      expect(User.findById).toHaveBeenCalledWith('1');
      expect(User.findById().select).toHaveBeenCalledWith('-password -__v');
      expect(User.findById().populate).toHaveBeenCalledWith({ path: 'rooms', select: 'name isPrivate' });
      expect(user).toEqual(mockUser);
      expect(logger.debug).toHaveBeenCalledWith('Fetched user by ID: 1');
    });

    it('should throw ErrorResponse if user is not found', async () => {
      User.findById().select.mockResolvedValue(null);

      await expect(userService.getUserById('nonexistent')).rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('User not found with ID: nonexistent');
    });
  });

  // --- updateUser tests ---
  describe('updateUser', () => {
    it('should update and return the user', async () => {
      const mockUpdatedUser = { _id: '1', username: 'AliceUpdated', email: 'alice@example.com' };
      User.findByIdAndUpdate().select.mockResolvedValue(mockUpdatedUser);

      const updatedUser = await userService.updateUser('1', { username: 'AliceUpdated' });
      expect(User.findByIdAndUpdate).toHaveBeenCalledWith('1', { username: 'AliceUpdated' }, { new: true, runValidators: true });
      expect(updatedUser).toEqual(mockUpdatedUser);
      expect(logger.info).toHaveBeenCalledWith('User updated: 1');
    });

    it('should throw ErrorResponse if user to update is not found', async () => {
      User.findByIdAndUpdate().select.mockResolvedValue(null);

      await expect(userService.updateUser('nonexistent', { username: 'NewName' })).rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('Attempted to update non-existent user with ID: nonexistent');
    });
  });

  // --- deleteUser tests ---
  describe('deleteUser', () => {
    it('should delete the user', async () => {
      const mockUser = { _id: '1', deleteOne: jest.fn().mockResolvedValue(true) };
      User.findById.mockResolvedValue(mockUser);

      await userService.deleteUser('1');
      expect(User.findById).toHaveBeenCalledWith('1');
      expect(mockUser.deleteOne).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('User deleted: 1');
    });

    it('should throw ErrorResponse if user to delete is not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(userService.deleteUser('nonexistent')).rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('Attempted to delete non-existent user with ID: nonexistent');
    });
  });
});
```