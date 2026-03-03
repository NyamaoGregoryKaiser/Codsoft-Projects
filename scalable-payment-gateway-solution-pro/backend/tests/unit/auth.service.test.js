const authService = require('../../src/modules/auth/auth.service');
const userService = require('../../src/modules/users/user.service');
const ApiError = require('../../src/utils/ApiError');
const bcrypt = require('bcryptjs');

// Mock external dependencies
jest.mock('../../src/modules/users/user.service');
jest.mock('bcryptjs'); // Mock bcrypt for password checks

describe('Auth Service', () => {
  describe('loginUserWithEmailAndPassword', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password: 'hashedPassword',
      isPasswordMatch: jest.fn(),
      toPublicJSON: jest.fn(() => ({ id: 1, email: 'test@example.com' }))
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return user if login is successful', async () => {
      userService.getUserByEmail.mockResolvedValue(mockUser);
      mockUser.isPasswordMatch.mockResolvedValue(true);

      const user = await authService.loginUserWithEmailAndPassword('test@example.com', 'password123');
      expect(user).toEqual(mockUser);
      expect(userService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.isPasswordMatch).toHaveBeenCalledWith('password123');
    });

    it('should throw 401 error if user not found', async () => {
      userService.getUserByEmail.mockResolvedValue(null);

      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password'))
        .rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password'))
        .rejects.toHaveProperty('statusCode', 401);
    });

    it('should throw 401 error if password does not match', async () => {
      userService.getUserByEmail.mockResolvedValue(mockUser);
      mockUser.isPasswordMatch.mockResolvedValue(false);

      await expect(authService.loginUserWithEmailAndPassword('test@example.com', 'wrongpassword'))
        .rejects.toThrow(ApiError);
      await expect(authService.loginUserWithEmailAndPassword('test@example.com', 'wrongpassword'))
        .rejects.toHaveProperty('statusCode', 401);
    });
  });

  describe('generateAuthTokens', () => {
    // Mock JWT_SECRET for consistent testing
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_ACCESS_EXPIRATION_MINUTES = 1; // 1 minute for testing

    const mockUser = { id: 1, email: 'test@example.com' };

    it('should generate access and refresh tokens', async () => {
      const tokens = await authService.generateAuthTokens(mockUser);

      expect(tokens).toHaveProperty('access.token');
      expect(tokens).toHaveProperty('access.expires');
      expect(tokens).toHaveProperty('refresh.token');
      expect(tokens).toHaveProperty('refresh.expires');

      // Basic JWT structure check (not full validation)
      expect(tokens.access.token.split('.').length).toBe(3);
      expect(tokens.refresh.token.split('.').length).toBe(3);
    });
  });
});