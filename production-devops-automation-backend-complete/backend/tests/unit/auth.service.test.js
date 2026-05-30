```javascript
const authService = require('../../src/services/auth.service');
const { User } = require('../../src/models');
const AppError = require('../../src/utils/appError');
const jwtUtil = require('../../src/utils/jwt.util');
const bcrypt = require('bcryptjs');

// Mock external dependencies
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('../../src/utils/jwt.util', () => ({
  generateToken: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => 'mockedsalt'),
  hash: jest.fn(() => 'hashedPassword'),
  compare: jest.fn(),
}));
jest.mock('../../src/config/logger.config', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('authService', () => {
  const mockUser = {
    id: 'some-uuid',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    comparePassword: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jwtUtil.generateToken.mockReturnValue('mockedToken');
  });

  describe('registerUser', () => {
    it('should register a user and return a token', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const { user, token } = await authService.registerUser('testuser', 'test@example.com', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword', // Should be hashed by model hook
        role: 'user',
      });
      expect(jwtUtil.generateToken).toHaveBeenCalledWith({ id: mockUser.id, role: mockUser.role });
      expect(user).toEqual(mockUser);
      expect(token).toBe('mockedToken');
    });

    it('should throw AppError if user with email already exists', async () => {
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.registerUser('testuser', 'test@example.com', 'password123'))
        .rejects.toThrow(new AppError('User with that email already exists.', 400));
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should re-throw other errors', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));

      await expect(authService.registerUser('testuser', 'test@example.com', 'password123'))
        .rejects.toThrow('DB error');
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      mockUser.comparePassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(mockUser);

      const { user, token } = await authService.loginUser('test@example.com', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(jwtUtil.generateToken).toHaveBeenCalledWith({ id: mockUser.id, role: mockUser.role });
      expect(user).toEqual(mockUser);
      expect(token).toBe('mockedToken');
    });

    it('should throw AppError for invalid email', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toThrow(new AppError('Invalid credentials', 401));
    });

    it('should throw AppError for invalid password', async () => {
      mockUser.comparePassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects.toThrow(new AppError('Invalid credentials', 401));
    });

    it('should re-throw other errors', async () => {
      User.findOne.mockRejectedValue(new Error('DB error'));

      await expect(authService.loginUser('test@example.com', 'password123'))
        .rejects.toThrow('DB error');
    });
  });
});
```