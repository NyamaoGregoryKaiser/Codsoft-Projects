import * as authService from '../../../src/modules/auth/auth.service';
import prisma from '../../../src/config/database';
import * as passwordUtils from '../../../src/utils/password';
import * as jwtUtils from '../../../src/utils/jwt';
import { ApiError } from '../../../src/middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import { UserRole } from '@prisma/client';
import config from '../../../src/config/env';

// Mock Prisma client and utils
jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  token: {
    create: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock('../../../src/utils/password');
jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/config/env', () => ({
  ...jest.requireActual('../../../src/config/env').default,
  JWT_REFRESH_EXPIRATION_DAYS: 7, // Ensure this matches actual config for expiration calculation
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockPasswordUtils = passwordUtils as jest.Mocked<typeof passwordUtils>;
const mockJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Register User ---
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPasswordUtils.hashPassword.mockResolvedValue('hashedPassword');
      const newUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.create.mockResolvedValue(newUser);

      const user = await authService.registerUser('test@example.com', 'password123', 'Test User');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockPasswordUtils.hashPassword).toHaveBeenCalledWith('password123');
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashedPassword',
          name: 'Test User',
          role: UserRole.USER,
        },
      });
      expect(user).toEqual(newUser);
    });

    it('should throw ApiError if email is already registered', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', email: 'test@example.com', password: 'hash', name: 'Test', role: UserRole.USER } as any);

      await expect(authService.registerUser('test@example.com', 'password123', 'Test User')).rejects.toThrow(
        new ApiError(StatusCodes.BAD_REQUEST, 'Email already registered')
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });

  // --- Login User ---
  describe('loginUser', () => {
    it('should log in a user and generate tokens', async () => {
      const existingUser = {
        id: 'user1',
        email: 'test@example.com',
        password: 'hashedPassword',
        name: 'Test User',
        role: UserRole.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPasswordUtils.comparePassword.mockResolvedValue(true);
      mockJwtUtils.generateToken
        .mockReturnValueOnce('accessToken')
        .mockReturnValueOnce('refreshToken');
      mockPrisma.token.create.mockResolvedValue({} as any);

      const tokens = await authService.loginUser('test@example.com', 'password123');

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockPasswordUtils.comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith(existingUser.id, existingUser.email, existingUser.role, 'access');
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith(existingUser.id, existingUser.email, existingUser.role, 'refresh');
      expect(mockPrisma.token.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          token: 'refreshToken',
          userId: existingUser.id,
        }),
      }));
      expect(tokens).toEqual({ accessToken: 'accessToken', refreshToken: 'refreshToken' });
    });

    it('should throw ApiError for incorrect email or password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null); // User not found
      await expect(authService.loginUser('test@example.com', 'password123')).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password')
      );
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockPasswordUtils.comparePassword).not.toHaveBeenCalled();

      mockPrisma.user.findUnique.mockResolvedValue({ id: 'user1', email: 'test@example.com', password: 'hashedPassword', name: 'Test', role: UserRole.USER } as any);
      mockPasswordUtils.comparePassword.mockResolvedValue(false); // Incorrect password
      await expect(authService.loginUser('test@example.com', 'password123')).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Incorrect email or password')
      );
    });
  });

  // --- Refresh Tokens ---
  describe('refreshAuthTokens', () => {
    it('should refresh tokens successfully', async () => {
      const oldRefreshToken = 'oldRefreshToken';
      const decodedToken = { userId: 'user1', email: 'test@example.com', role: UserRole.USER, type: 'refresh' };
      const existingUser = {
        id: 'user1',
        email: 'test@example.com',
        name: 'Test User',
        role: UserRole.USER,
      };
      const storedToken = {
        id: 'token1',
        token: oldRefreshToken,
        userId: 'user1',
        user: existingUser,
        expiresAt: new Date(Date.now() + 10000), // Not expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJwtUtils.verifyToken.mockReturnValue(decodedToken);
      mockPrisma.token.findUnique.mockResolvedValue(storedToken as any);
      mockPrisma.token.delete.mockResolvedValue({} as any);
      mockJwtUtils.generateToken
        .mockReturnValueOnce('newAccessToken')
        .mockReturnValueOnce('newRefreshToken');
      mockPrisma.token.create.mockResolvedValue({} as any);

      const newTokens = await authService.refreshAuthTokens(oldRefreshToken);

      expect(mockJwtUtils.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(mockPrisma.token.findUnique).toHaveBeenCalledWith({
        where: { token: oldRefreshToken },
        include: { user: true },
      });
      expect(mockPrisma.token.delete).toHaveBeenCalledWith({ where: { id: 'token1' } });
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith('user1', 'test@example.com', UserRole.USER, 'access');
      expect(mockJwtUtils.generateToken).toHaveBeenCalledWith('user1', 'test@example.com', UserRole.USER, 'refresh');
      expect(mockPrisma.token.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          token: 'newRefreshToken',
          userId: 'user1',
        }),
      }));
      expect(newTokens).toEqual({ accessToken: 'newAccessToken', refreshToken: 'newRefreshToken' });
    });

    it('should throw ApiError for invalid or expired refresh token (decoded failed)', async () => {
      mockJwtUtils.verifyToken.mockReturnValue(null);
      await expect(authService.refreshAuthTokens('invalidToken')).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token')
      );
    });

    it('should throw ApiError for refresh token not found in DB', async () => {
      const decodedToken = { userId: 'user1', email: 'test@example.com', role: UserRole.USER, type: 'refresh' };
      mockJwtUtils.verifyToken.mockReturnValue(decodedToken);
      mockPrisma.token.findUnique.mockResolvedValue(null);

      await expect(authService.refreshAuthTokens('unknownToken')).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired or invalid')
      );
    });

    it('should throw ApiError for expired refresh token in DB', async () => {
      const oldRefreshToken = 'expiredToken';
      const decodedToken = { userId: 'user1', email: 'test@example.com', role: UserRole.USER, type: 'refresh' };
      const storedToken = {
        id: 'token1',
        token: oldRefreshToken,
        userId: 'user1',
        expiresAt: new Date(Date.now() - 10000), // Expired
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockJwtUtils.verifyToken.mockReturnValue(decodedToken);
      mockPrisma.token.findUnique.mockResolvedValue(storedToken as any);
      mockPrisma.token.delete.mockResolvedValue({} as any); // Should delete expired token

      await expect(authService.refreshAuthTokens(oldRefreshToken)).rejects.toThrow(
        new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired or invalid')
      );
      expect(mockPrisma.token.delete).toHaveBeenCalledWith({ where: { id: 'token1' } });
    });
  });

  // --- Logout User ---
  describe('logoutUser', () => {
    it('should delete the refresh token on logout', async () => {
      const refreshToken = 'validRefreshToken';
      const storedToken = {
        id: 'token1',
        token: refreshToken,
        userId: 'user1',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrisma.token.findUnique.mockResolvedValue(storedToken as any);
      mockPrisma.token.delete.mockResolvedValue({} as any);

      await authService.logoutUser(refreshToken);

      expect(mockPrisma.token.findUnique).toHaveBeenCalledWith({ where: { token: refreshToken } });
      expect(mockPrisma.token.delete).toHaveBeenCalledWith({ where: { id: 'token1' } });
    });

    it('should throw ApiError if refresh token not found on logout', async () => {
      mockPrisma.token.findUnique.mockResolvedValue(null);

      await expect(authService.logoutUser('nonExistentToken')).rejects.toThrow(
        new ApiError(StatusCodes.NOT_FOUND, 'Refresh token not found')
      );
      expect(mockPrisma.token.delete).not.toHaveBeenCalled();
    });
  });
});