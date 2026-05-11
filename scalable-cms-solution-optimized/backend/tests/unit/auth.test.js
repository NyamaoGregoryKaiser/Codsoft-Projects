const authService = require('../../src/services/authService');
const { User } = require('../../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../../src/config/config');

// Mock User model
jest.mock('../../src/models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  Sequelize: { Op: { or: jest.fn() } } // Mock Sequelize.Op for existing user check
}));

// Mock bcrypt for password hashing/comparison
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  // --- Register User Tests ---
  describe('register', () => {
    it('should successfully register a new user and return a token', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'viewer'
      };
      const hashedPassword = 'hashedPassword123';
      const token = 'mockToken';

      bcrypt.hash.mockResolvedValue(hashedPassword);
      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue({
        id: '123e4567-e89b-12d3-a456-426614174000',
        ...userData,
        password: hashedPassword,
        toJSON: () => ({ id: '123e4567-e89b-12d3-a456-426614174000', ...userData, password: hashedPassword })
      });
      jwt.sign.mockReturnValue(token);

      const result = await authService.register(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, config.bcryptSaltRounds);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { [config.Sequelize.Op.or]: [{ email: userData.email }, { username: userData.username }] }
      }); // This will fail because Sequelize is not mocked fully
      expect(User.create).toHaveBeenCalledWith(userData);
      expect(jwt.sign).toHaveBeenCalledWith({ id: '123e4567-e89b-12d3-a456-426614174000' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined(); // Password should be excluded
      expect(result.token).toBe(token);
    });

    it('should throw an error if username or email already exists', async () => {
      const userData = {
        username: 'existinguser',
        email: 'existing@example.com',
        password: 'password123'
      };
      User.findOne.mockResolvedValue({ id: 'some-uuid', email: userData.email }); // User exists

      await expect(authService.register(userData)).rejects.toMatchObject({
        message: 'User with this email or username already exists',
        statusCode: 409
      });
      expect(User.create).not.toHaveBeenCalled();
    });

    it('should throw an error on database failure', async () => {
      const userData = { username: 'fail', email: 'fail@example.com', password: 'password' };
      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue(new Error('DB Error'));

      await expect(authService.register(userData)).rejects.toThrow('DB Error');
    });
  });

  // --- Login User Tests ---
  describe('login', () => {
    it('should successfully log in a user and return a token', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';
      const token = 'mockToken';

      const mockUser = {
        id: 'user-id-1',
        email,
        password: hashedPassword,
        isActive: true,
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 'user-id-1', email, password: hashedPassword, isActive: true })
      };

      User.findOne.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue(token);

      const result = await authService.login(email, password);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(mockUser.save).toHaveBeenCalled(); // lastLogin updated
      expect(jwt.sign).toHaveBeenCalledWith({ id: mockUser.id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
      expect(result.user).toBeDefined();
      expect(result.user.password).toBeUndefined();
      expect(result.token).toBe(token);
    });

    it('should throw an error for invalid credentials', async () => {
      const email = 'invalid@example.com';
      const password = 'wrongpassword';

      User.findOne.mockResolvedValue(null); // User not found

      await expect(authService.login(email, password)).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401
      });
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });

      const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
      User.findOne.mockResolvedValue(mockUser); // User found but wrong password

      await expect(authService.login(email, password)).rejects.toMatchObject({
        message: 'Invalid email or password',
        statusCode: 401
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
    });

    it('should throw an error if user account is inactive', async () => {
      const email = 'inactive@example.com';
      const password = 'password123';
      const hashedPassword = 'hashedPassword123';

      const mockUser = {
        id: 'user-id-2',
        email,
        password: hashedPassword,
        isActive: false, // Inactive user
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 'user-id-2', email, password: hashedPassword, isActive: false })
      };
      User.findOne.mockResolvedValue(mockUser);

      await expect(authService.login(email, password)).rejects.toMatchObject({
        message: 'User account is inactive. Please contact support.',
        statusCode: 403
      });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(mockUser.save).not.toHaveBeenCalled(); // lastLogin not updated
    });
  });

  // --- Get Profile Tests ---
  describe('getProfile', () => {
    it('should retrieve a user profile by ID', async () => {
      const userId = 'user-id-1';
      const mockUser = {
        id: userId,
        username: 'testuser',
        email: 'test@example.com',
        role: 'viewer',
        toJSON: () => ({ id: userId, username: 'testuser', email: 'test@example.com', role: 'viewer' })
      };
      User.findByPk.mockResolvedValue(mockUser);

      const result = await authService.getProfile(userId);

      expect(User.findByPk).toHaveBeenCalledWith(userId, { attributes: { exclude: ['password'] } });
      expect(result).toEqual(mockUser);
      expect(result.password).toBeUndefined(); // Ensure password is excluded
    });

    it('should throw an error if user profile is not found', async () => {
      const userId = 'non-existent-id';
      User.findByPk.mockResolvedValue(null);

      await expect(authService.getProfile(userId)).rejects.toMatchObject({
        message: 'User not found',
        statusCode: 404
      });
    });
  });
});
```