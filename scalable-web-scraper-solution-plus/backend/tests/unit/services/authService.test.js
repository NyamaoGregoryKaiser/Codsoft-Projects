```javascript
const authService = require('../../../src/services/authService');
const { User } = require('../../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../../src/config');
const { v4: uuidv4 } = require('uuid');

// Mock User model methods
jest.mock('../../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
}));

// Mock bcrypt for password hashing comparison
jest.mock('bcryptjs', () => ({
  genSalt: jest.fn(() => Promise.resolve('mockSalt')),
  hash: jest.fn(() => Promise.resolve('hashedPassword')),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mockedToken'),
}));

describe('Auth Service Unit Tests', () => {
  const testUserId = uuidv4();
  const testUser = {
    id: testUserId,
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedPassword',
    role: 'user',
    matchPassword: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user and return user data with token', async () => {
      User.findOne.mockResolvedValue(null); // User does not exist
      User.create.mockResolvedValue({ ...testUser, password: 'rawPassword' }); // Pass a mock user object for create
      bcrypt.hash.mockResolvedValue('hashedPassword');
      jwt.sign.mockReturnValue('mockedToken');

      const result = await authService.registerUser('newuser', 'new@example.com', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(User.create).toHaveBeenCalledWith({
        username: 'newuser',
        email: 'new@example.com',
        password: 'hashedPassword',
      });
      expect(result).toHaveProperty('token', 'mockedToken');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw an error if user already exists', async () => {
      User.findOne.mockResolvedValue(testUser); // User already exists

      await expect(authService.registerUser('existing', 'test@example.com', 'password123'))
        .rejects
        .toThrow('User already exists');
    });

    it('should throw an error if user data is invalid (e.g., create fails)', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(null); // Simulate create failure

      await expect(authService.registerUser('invalid', 'invalid@example.com', 'password123'))
        .rejects
        .toThrow('Invalid user data');
    });
  });

  describe('loginUser', () => {
    it('should log in user and return user data with token', async () => {
      testUser.matchPassword.mockResolvedValue(true);
      User.findOne.mockResolvedValue(testUser);
      jwt.sign.mockReturnValue('mockedToken');

      const result = await authService.loginUser('test@example.com', 'password123');

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(testUser.matchPassword).toHaveBeenCalledWith('password123');
      expect(result).toHaveProperty('token', 'mockedToken');
      expect(result).toHaveProperty('email', 'test@example.com');
    });

    it('should throw an error for invalid email', async () => {
      User.findOne.mockResolvedValue(null); // No user found

      await expect(authService.loginUser('nonexistent@example.com', 'password123'))
        .rejects
        .toThrow('Invalid email or password');
    });

    it('should throw an error for invalid password', async () => {
      testUser.matchPassword.mockResolvedValue(false);
      User.findOne.mockResolvedValue(testUser);

      await expect(authService.loginUser('test@example.com', 'wrongpassword'))
        .rejects
        .toThrow('Invalid email or password');
    });
  });

  describe('getUserById', () => {
    it('should return user data for a valid ID', async () => {
      User.findByPk.mockResolvedValue({ ...testUser, password: undefined }); // Simulate password excluded

      const result = await authService.getUserById(testUserId);

      expect(User.findByPk).toHaveBeenCalledWith(testUserId, {
        attributes: { exclude: ['password'] }
      });
      expect(result).toHaveProperty('id', testUserId);
      expect(result).not.toHaveProperty('password');
    });

    it('should throw an error if user not found', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(authService.getUserById('nonexistent-id'))
        .rejects
        .toThrow('User not found');
    });
  });
});
```