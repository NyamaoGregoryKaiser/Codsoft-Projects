const authService = require('../../src/services/authService');
const { User } = require('../../src/models');
const { ApiError } = require('../../src/middleware/errorHandler');
const { generateToken } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

// Mock User model for isolated unit testing
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// Mock JWT for consistent token generation
jest.mock('../../src/utils/jwt', () => ({
  generateToken: jest.fn(() => 'mock-jwt-token'),
}));

// Mock bcrypt for password hashing comparison
jest.mock('bcryptjs', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hashedPassword) => Promise.resolve(password === 'correctPassword')),
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // --- Register User ---
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'subscriber',
      };
      const mockUserInstance = {
        id: 'user-id-123',
        ...userData,
        password: 'hashed_password123',
        save: jest.fn(),
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUserInstance);

      const result = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({
        where: {
          [User.sequelize.Op.or]: [{ email: userData.email }, { username: userData.username }],
        },
      });
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10); // Check password hashing
      expect(generateToken).toHaveBeenCalledWith(mockUserInstance);
      expect(result).toEqual({
        user: {
          id: mockUserInstance.id,
          username: mockUserInstance.username,
          email: mockUserInstance.email,
          role: mockUserInstance.role,
        },
        token: 'mock-jwt-token',
      });
    });

    it('should throw ApiError if email already exists', async () => {
      const userData = { username: 'testuser', email: 'existing@example.com', password: 'password123' };
      User.findOne.mockResolvedValue({ email: 'existing@example.com' }); // Simulate existing email

      await expect(authService.registerUser(userData)).rejects.toThrow(new ApiError(400, 'User with this email already exists.'));
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should throw ApiError if username already exists', async () => {
      const userData = { username: 'existinguser', email: 'test@example.com', password: 'password123' };
      User.findOne.mockResolvedValue({ username: 'existinguser', email: 'different@example.com' }); // Simulate existing username

      await expect(authService.registerUser(userData)).rejects.toThrow(new ApiError(400, 'User with this username already exists.'));
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  // --- Login User ---
  describe('loginUser', () => {
    it('should log in user successfully and return token', async () => {
      const mockUserInstance = {
        id: 'user-id-456',
        email: 'login@example.com',
        username: 'loginuser',
        role: 'subscriber',
        password: 'hashed_correctPassword',
        validPassword: jest.fn(() => Promise.resolve(true)), // Mock successful password comparison
        save: jest.fn(),
      };

      User.findOne.mockResolvedValue(mockUserInstance);

      const result = await authService.loginUser('login@example.com', 'correctPassword');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'login@example.com' } });
      expect(mockUserInstance.validPassword).toHaveBeenCalledWith('correctPassword');
      expect(mockUserInstance.save).toHaveBeenCalled(); // lastLogin updated
      expect(generateToken).toHaveBeenCalledWith(mockUserInstance);
      expect(result).toEqual({
        user: {
          id: mockUserInstance.id,
          username: mockUserInstance.username,
          email: mockUserInstance.email,
          role: mockUserInstance.role,
        },
        token: 'mock-jwt-token',
      });
    });

    it('should throw ApiError for invalid credentials (user not found)', async () => {
      User.findOne.mockResolvedValue(null); // No user found

      await expect(authService.loginUser('nonexistent@example.com', 'password')).rejects.toThrow(new ApiError(401, 'Invalid credentials'));
    });

    it('should throw ApiError for invalid credentials (wrong password)', async () => {
      const mockUserInstance = {
        email: 'login@example.com',
        password: 'hashed_correctPassword',
        validPassword: jest.fn(() => Promise.resolve(false)), // Mock failed password comparison
      };
      User.findOne.mockResolvedValue(mockUserInstance);

      await expect(authService.loginUser('login@example.com', 'wrongPassword')).rejects.toThrow(new ApiError(401, 'Invalid credentials'));
      expect(mockUserInstance.validPassword).toHaveBeenCalledWith('wrongPassword');
    });
  });

  // --- Get User Profile ---
  describe('getUserProfile', () => {
    it('should return user profile if found', async () => {
      const mockUserInstance = {
        id: 'user-id-789',
        username: 'profileuser',
        email: 'profile@example.com',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(),
      };
      User.findByPk.mockResolvedValue(mockUserInstance);

      const result = await authService.getUserProfile('user-id-789');

      expect(User.findByPk).toHaveBeenCalledWith('user-id-789', {
        attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt', 'lastLogin'],
      });
      expect(result).toEqual(mockUserInstance);
    });

    it('should throw ApiError if user profile not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(authService.getUserProfile('nonexistent-id')).rejects.toThrow(new ApiError(404, 'User not found'));
    });
  });
});