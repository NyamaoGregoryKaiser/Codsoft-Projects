```javascript
const authService = require('../../services/authService');
const User = require('../../models/User');
const ErrorResponse = require('../../utils/errorResponse');
const logger = require('../../config/winston'); // Mock logger for tests

// Mock User model
jest.mock('../../models/User', () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndRemove: jest.fn(),
  // Mock methods used by user instance
  prototype: {
    matchPassword: jest.fn(),
    getSignedJwtToken: jest.fn(),
  },
}));

// Mock logger to prevent actual logging during tests
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- registerUser tests ---
  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        _id: 'user1id',
        username: 'testuser',
        email: 'test@example.com',
      });

      const user = await authService.registerUser('testuser', 'test@example.com', 'password123');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.create).toHaveBeenCalledWith({ username: 'testuser', email: 'test@example.com', password: 'password123' });
      expect(user).toHaveProperty('_id', 'user1id');
      expect(logger.info).toHaveBeenCalledWith('User registered successfully: test@example.com');
    });

    it('should throw ErrorResponse if user with email already exists', async () => {
      User.findOne.mockResolvedValue(true); // User already exists

      await expect(authService.registerUser('testuser', 'test@example.com', 'password123'))
        .rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('Attempted registration with existing email: test@example.com');
    });
  });

  // --- loginUser tests ---
  describe('loginUser', () => {
    it('should successfully log in a user with correct credentials', async () => {
      const mockUser = {
        _id: 'user1id',
        username: 'testuser',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      const user = await authService.loginUser('test@example.com', 'password123');
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(user.matchPassword).toHaveBeenCalledWith('password123');
      expect(user).toHaveProperty('_id', 'user1id');
      expect(logger.info).toHaveBeenCalledWith('User logged in successfully: test@example.com');
    });

    it('should throw ErrorResponse for invalid email', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null) // User not found
      });

      await expect(authService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('Login attempt with invalid email: nonexistent@example.com');
    });

    it('should throw ErrorResponse for incorrect password', async () => {
      const mockUser = {
        _id: 'user1id',
        username: 'testuser',
        email: 'test@example.com',
        matchPassword: jest.fn().mockResolvedValue(false), // Incorrect password
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow(ErrorResponse);
      expect(logger.warn).toHaveBeenCalledWith('Login attempt with incorrect password for email: test@example.com');
    });
  });

  // --- getMe tests ---
  describe('getMe', () => {
    it('should return user details for a valid ID', async () => {
      const mockUser = {
        _id: 'user1id',
        username: 'testuser',
        email: 'test@example.com',
        populate: jest.fn().mockReturnThis(), // Mock populate to return itself for chaining
      };
      User.findById.mockReturnValue(mockUser);

      const user = await authService.getMe('user1id');
      expect(User.findById).toHaveBeenCalledWith('user1id');
      expect(user.populate).toHaveBeenCalledWith({ path: 'rooms', select: 'name isPrivate' });
      expect(user).toHaveProperty('_id', 'user1id');
    });

    it('should throw ErrorResponse if user is not found', async () => {
      User.findById.mockResolvedValue(null);

      await expect(authService.getMe('nonexistentid'))
        .rejects.toThrow(ErrorResponse);
      expect(logger.error).toHaveBeenCalledWith('User not found for ID: nonexistentid in getMe service');
    });
  });
});
```