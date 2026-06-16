```javascript
const authService = require('../../services/authService');
const { User } = require('../../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

jest.mock('../../models', () => ({
  User: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-jwt-token'),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth Service Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      User.findOne.mockResolvedValue(null); // No existing user
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      User.create.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
        toJSON: () => ({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }),
      });

      const userData = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      const user = await authService.registerUser(userData);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: userData.email } });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 10);
      expect(User.create).toHaveBeenCalledWith({
        username: userData.username,
        email: userData.email,
        password: 'hashedPassword123',
        role: 'user',
      });
      expect(user).toEqual({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' });
    });

    it('should throw an error if user with email already exists', async () => {
      User.findOne.mockResolvedValue(true); // User exists

      const userData = { username: 'testuser', email: 'test@example.com', password: 'password123' };
      await expect(authService.registerUser(userData)).rejects.toThrow('User with this email already exists.');
      expect(User.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        comparePassword: jest.fn(() => true),
        toJSON: () => ({ id: 1, username: 'testuser', email: 'test@example.com', role: 'user' }),
      };
      User.findOne.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await authService.loginUser(credentials);

      expect(User.findOne).toHaveBeenCalledWith({ where: { email: credentials.email } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(credentials.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id, role: mockUser.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );
      expect(result).toEqual({ token: 'mock-jwt-token', user: mockUser.toJSON() });
    });

    it('should throw an error for invalid credentials (user not found)', async () => {
      User.findOne.mockResolvedValue(null);

      const credentials = { email: 'nonexistent@example.com', password: 'password123' };
      await expect(authService.loginUser(credentials)).rejects.toThrow('Invalid credentials.');
    });

    it('should throw an error for invalid credentials (incorrect password)', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedPassword123',
        role: 'user',
        comparePassword: jest.fn(() => false),
      };
      User.findOne.mockResolvedValue(mockUser);

      const credentials = { email: 'test@example.com', password: 'wrongpassword' };
      await expect(authService.loginUser(credentials)).rejects.toThrow('Invalid credentials.');
    });
  });
});
```