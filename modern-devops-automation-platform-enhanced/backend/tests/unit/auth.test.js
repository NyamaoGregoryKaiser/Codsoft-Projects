```javascript
const authService = require('../../src/services/authService');
const { User } = require('../../src/models');
const { sequelize } = require('../../src/config/db');
const { generateToken, verifyToken } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

// Mock User model methods
jest.mock('../../src/models', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn(),
  },
  Product: {}, // Mock other models if needed
  sequelize: {
    define: jest.fn(),
    sync: jest.fn(),
  }
}));

// Mock bcrypt and jwt
jest.mock('bcryptjs');
jest.mock('../../src/utils/jwt');

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  describe('registerUser', () => {
    it('should register a new user and return a token', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
      };

      User.findOne.mockResolvedValue(null); // User does not exist
      User.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mockToken');

      const { user, token } = await authService.registerUser(
        'testuser',
        'test@example.com',
        'password123'
      );

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(User.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123', // password hashing is handled by model hook, not service directly
      });
      expect(generateToken).toHaveBeenCalledWith({ id: mockUser.id, role: mockUser.role });
      expect(user).toEqual(mockUser);
      expect(token).toBe('mockToken');
    });

    it('should throw an error if user with email already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'test@example.com' }); // User already exists

      await expect(
        authService.registerUser('testuser', 'test@example.com', 'password123')
      ).rejects.toThrow('User with this email already exists');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token with valid credentials', async () => {
      const mockUser = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockResolvedValue(mockUser);
      generateToken.mockReturnValue('mockToken');

      const { user, token } = await authService.loginUser(
        'test@example.com',
        'password123'
      );

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(generateToken).toHaveBeenCalledWith({ id: mockUser.id, role: mockUser.role });
      expect(user).toEqual(mockUser);
      expect(token).toBe('mockToken');
    });

    it('should throw an error for invalid email', async () => {
      User.findOne.mockResolvedValue(null); // User not found

      await expect(
        authService.loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error for invalid password', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: 'hashedpassword',
        comparePassword: jest.fn().mockResolvedValue(false), // Incorrect password
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(
        authService.loginUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});
```