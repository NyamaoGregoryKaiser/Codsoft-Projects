```javascript
const authService = require('../../services/authService');
const { User } = require('../../models');
const { generateToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../../models');

jest.mock('../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  sequelize: {
    authenticate: jest.fn(),
    sync: jest.fn(),
    close: jest.fn(),
  },
}));

jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn(() => 'mocked_jwt_token'),
  verifyToken: jest.fn(),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.hash.mockResolvedValue('hashedPassword123');
  });

  describe('registerUser', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      const mockNewUser = {
        id: 'user-id-123',
        username: userData.username,
        email: userData.email,
      };

      User.findOne.mockResolvedValue(null); // User does not exist
      User.create.mockResolvedValue(mockNewUser);

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(User.create).toHaveBeenCalledWith({
        username: userData.username,
        email: userData.email,
        passwordHash: userData.password,
      });
      expect(generateToken).toHaveBeenCalledWith({ id: mockNewUser.id });
      expect(result).toEqual({
        user: {
          id: mockNewUser.id,
          username: mockNewUser.username,
          email: mockNewUser.email,
        },
        token: 'mocked_jwt_token',
      });
    });

    it('should throw an error if username, email, or password are missing', async () => {
      await expect(authService.registerUser({ username: 'user', email: 'a@b.com' }))
        .rejects.toThrow('Username, email, and password are required.');
      await expect(authService.registerUser({ username: 'user', password: 'pwd' }))
        .rejects.toThrow('Username, email, and password are required.');
      await expect(authService.registerUser({ email: 'a@b.com', password: 'pwd' }))
        .rejects.toThrow('Username, email, and password are required.');
    });

    it('should throw an error if user with email already exists', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      User.findOne.mockResolvedValue(true); // User already exists

      await expect(authService.registerUser(userData))
        .rejects.toThrow('User with this email already exists.');
    });

    it('should throw an error for Sequelize unique constraint error', async () => {
      const userData = {
        username: 'existinguser',
        email: 'test@example.com',
        password: 'password123',
      };
      const uniqueConstraintError = new Error('Unique constraint failed');
      uniqueConstraintError.name = 'SequelizeUniqueConstraintError';

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(uniqueConstraintError);

      await expect(authService.registerUser(userData))
        .rejects.toThrow('Registration failed: Username or email already in use.');
    });

    it('should throw a general error if user creation fails', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('Database error'));

      await expect(authService.registerUser(userData))
        .rejects.toThrow('Registration failed: Database error');
    });
  });

  describe('loginUser', () => {
    it('should successfully log in a user', async () => {
      const userData = { email: 'test@example.com', password: 'password123' };
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: userData.email,
        passwordHash: 'hashedPassword123',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);

      const result = await authService.loginUser(userData.email, userData.password);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
      expect(generateToken).toHaveBeenCalledWith({ id: mockUser.id });
      expect(result).toEqual({
        user: {
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        },
        token: 'mocked_jwt_token',
      });
    });

    it('should throw an error if email or password are missing', async () => {
      await expect(authService.loginUser('test@example.com', null))
        .rejects.toThrow('Email and password are required.');
      await expect(authService.loginUser(null, 'password123'))
        .rejects.toThrow('Email and password are required.');
    });

    it('should throw an error if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(authService.loginUser('nonexistent@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials.');
    });

    it('should throw an error for incorrect password', async () => {
      const userData = { email: 'test@example.com', password: 'wrongpassword' };
      const mockUser = {
        id: 'user-id-123',
        username: 'testuser',
        email: userData.email,
        passwordHash: 'hashedPassword123',
        comparePassword: jest.fn().mockResolvedValue(false),
      };
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.loginUser(userData.email, userData.password))
        .rejects.toThrow('Invalid credentials.');
      expect(mockUser.comparePassword).toHaveBeenCalledWith(userData.password);
    });
  });
});
```