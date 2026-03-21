const bcrypt = require('bcryptjs');
const knex = require('../../src/database/knexfile');
const authService = require('../../src/services/auth.service');
const { generateAuthTokens, verifyToken } = require('../../src/utils/jwt');
const config = require('../../src/config'); // Mock config if needed

// Mock dependencies
jest.mock('bcryptjs');
jest.mock('../../src/database/knexfile', () => {
  const mKnex = {
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn().mockReturnThis(),
  };
  return {
    ...mKnex,
    raw: jest.fn(() => Promise.resolve()), // Mock raw for server.js
    migrate: { latest: jest.fn(() => Promise.resolve()) },
    seed: { run: jest.fn(() => Promise.resolve()) },
  };
});
jest.mock('../../src/utils/jwt');
jest.mock('../../src/config', () => ({
  BCRYPT_SALT_ROUNDS: 10,
  JWT_SECRET: 'testsecret',
  JWT_ACCESS_EXPIRATION_MINUTES: 1,
  JWT_REFRESH_EXPIRATION_DAYS: 1,
}));


describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    knex.insert.mockReturnThis();
    knex.returning.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockReturnThis();
  });

  describe('registerUser', () => {
    test('should register a new user successfully', async () => {
      bcrypt.hash.mockResolvedValue('hashedPassword');
      knex.where.mockResolvedValueOnce(undefined); // No existing user
      knex.returning.mockResolvedValueOnce([1]); // userId

      generateAuthTokens.mockResolvedValueOnce({
        access: { token: 'accessToken', expires: new Date() },
        refresh: { token: 'refreshToken', expires: new Date() },
      });

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.registerUser(userData);

      expect(knex.where).toHaveBeenCalledWith({ email: userData.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, config.BCRYPT_SALT_ROUNDS);
      expect(knex.insert).toHaveBeenCalledWith({
        name: userData.name,
        email: userData.email,
        password: 'hashedPassword',
        role: 'user',
      });
      expect(generateAuthTokens).toHaveBeenCalledWith(1, 'user');
      expect(result).toEqual({
        userId: 1,
        tokens: {
          access: { token: 'accessToken', expires: expect.any(Date) },
          refresh: { token: 'refreshToken', expires: expect.any(Date) },
        },
      });
    });

    test('should throw error if email is already taken', async () => {
      knex.where.mockResolvedValueOnce({ id: 1, email: 'test@example.com' }); // Existing user

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.registerUser(userData)).rejects.toThrow('Email already taken.');
      expect(knex.insert).not.toHaveBeenCalled();
    });
  });

  describe('loginUserWithEmailAndPassword', () => {
    test('should login user successfully with correct credentials', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword', role: 'user' };
      knex.where.mockResolvedValueOnce(mockUser); // User found
      bcrypt.compare.mockResolvedValueOnce(true); // Password matches

      generateAuthTokens.mockResolvedValueOnce({
        access: { token: 'accessToken', expires: new Date() },
        refresh: { token: 'refreshToken', expires: new Date() },
      });

      const result = await authService.loginUserWithEmailAndPassword('test@example.com', 'password123');

      expect(knex.where).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(generateAuthTokens).toHaveBeenCalledWith(mockUser.id, mockUser.role);
      expect(result).toEqual({
        user: mockUser,
        tokens: {
          access: { token: 'accessToken', expires: expect.any(Date) },
          refresh: { token: 'refreshToken', expires: expect.any(Date) },
        },
      });
    });

    test('should throw error for incorrect email', async () => {
      knex.where.mockResolvedValueOnce(undefined); // User not found

      await expect(authService.loginUserWithEmailAndPassword('nonexistent@example.com', 'password123'))
        .rejects.toThrow('Incorrect email or password.');
    });

    test('should throw error for incorrect password', async () => {
      const mockUser = { id: 1, email: 'test@example.com', password: 'hashedPassword', role: 'user' };
      knex.where.mockResolvedValueOnce(mockUser);
      bcrypt.compare.mockResolvedValueOnce(false); // Password does not match

      await expect(authService.loginUserWithEmailAndPassword('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Incorrect email or password.');
    });
  });

  describe('refreshAuthTokens', () => {
    test('should refresh tokens successfully', async () => {
      const mockRefreshToken = 'mockRefreshToken';
      const mockUserId = 1;
      const mockUserRole = 'user';
      const mockUser = { id: mockUserId, role: mockUserRole };

      verifyToken.mockResolvedValueOnce({ sub: mockUserId, type: 'refresh' });
      knex.where.mockResolvedValueOnce(mockUser);
      knex.first.mockResolvedValueOnce(mockUser);

      generateAuthTokens.mockResolvedValueOnce({
        access: { token: 'newAccessToken', expires: new Date() },
        refresh: { token: 'newRefreshToken', expires: new Date() },
      });

      const result = await authService.refreshAuthTokens(mockRefreshToken);

      expect(verifyToken).toHaveBeenCalledWith(mockRefreshToken, config.JWT_SECRET);
      expect(knex.where).toHaveBeenCalledWith({ id: mockUserId });
      expect(generateAuthTokens).toHaveBeenCalledWith(mockUserId, mockUserRole);
      expect(result).toEqual({
        access: { token: 'newAccessToken', expires: expect.any(Date) },
        refresh: { token: 'newRefreshToken', expires: expect.any(Date) },
      });
    });

    test('should throw error if refresh token is invalid type', async () => {
      verifyToken.mockResolvedValueOnce({ sub: 1, type: 'access' }); // Wrong token type

      await expect(authService.refreshAuthTokens('mockAccessToken')).rejects.toThrow('Invalid refresh token.');
    });

    test('should throw error if user not found for refresh token', async () => {
      verifyToken.mockResolvedValueOnce({ sub: 999, type: 'refresh' }); // User ID doesn't exist
      knex.where.mockResolvedValueOnce(undefined); // User not found
      knex.first.mockResolvedValueOnce(undefined);

      await expect(authService.refreshAuthTokens('mockRefreshToken')).rejects.toThrow('User not found.');
    });

    test('should throw error if token verification fails', async () => {
      verifyToken.mockRejectedValueOnce(new Error('Invalid token'));

      await expect(authService.refreshAuthTokens('invalidToken')).rejects.toThrow('Please authenticate');
    });
  });
});