import { Request, Response, NextFunction } from 'express';
import { protect, authorize } from '../../../src/middleware/auth.middleware';
import { ApiError } from '../../../src/middleware/error.middleware';
import { StatusCodes } from 'http-status-codes';
import * as jwtUtils from '../../../src/utils/jwt';
import prisma from '../../../src/config/database';
import { AuthenticatedRequest, UserRole } from '../../../src/types';

jest.mock('../../../src/utils/jwt');
jest.mock('../../../src/config/database', () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

const mockJwtUtils = jwtUtils as jest.Mocked<typeof jwtUtils>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Auth Middleware', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  // --- Protect Middleware ---
  describe('protect', () => {
    it('should call next if token is valid and user exists', async () => {
      mockRequest.headers = { authorization: 'Bearer validToken' };
      mockJwtUtils.verifyToken.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.USER,
        type: 'access',
      });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user123',
        email: 'test@example.com',
        role: UserRole.USER,
      } as any);

      await protect(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwtUtils.verifyToken).toHaveBeenCalledWith('validToken');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { id: true, email: true, role: true },
      });
      expect(mockRequest.user).toEqual({ id: 'user123', email: 'test@example.com', role: UserRole.USER });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ApiError if no token is provided', async () => {
      mockRequest.headers = {}; // No authorization header

      await protect(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized');
    });

    it('should throw ApiError if token is invalid or expired', async () => {
      mockRequest.headers = { authorization: 'Bearer invalidToken' };
      mockJwtUtils.verifyToken.mockReturnValue(null); // Invalid token

      await protect(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockJwtUtils.verifyToken).toHaveBeenCalledWith('invalidToken');
      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.message).toBe('Invalid or expired access token'); // Specific message from the middleware
    });

    it('should throw ApiError if token is a refresh token', async () => {
      mockRequest.headers = { authorization: 'Bearer refreshToken' };
      mockJwtUtils.verifyToken.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.USER,
        type: 'refresh', // This should be 'access'
      });

      await protect(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.message).toBe('Invalid or expired access token');
    });

    it('should throw ApiError if user not found for token', async () => {
      mockRequest.headers = { authorization: 'Bearer validToken' };
      mockJwtUtils.verifyToken.mockReturnValue({
        userId: 'user123',
        email: 'test@example.com',
        role: UserRole.USER,
        type: 'access',
      });
      mockPrisma.user.findUnique.mockResolvedValue(null); // User does not exist

      await protect(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user123' },
        select: { id: true, email: true, role: true },
      });
      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.UNAUTHORIZED);
      expect(error.message).toBe('User not found for token');
    });
  });

  // --- Authorize Middleware ---
  describe('authorize', () => {
    it('should call next if user has required role', () => {
      mockRequest.user = { id: 'user123', email: 'test@example.com', role: UserRole.ADMIN };
      const authorizeMiddleware = authorize([UserRole.ADMIN]);

      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next if user has one of multiple required roles', () => {
      mockRequest.user = { id: 'user123', email: 'test@example.com', role: UserRole.USER };
      const authorizeMiddleware = authorize([UserRole.ADMIN, UserRole.USER]);

      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should throw ApiError if user is not authenticated', () => {
      mockRequest.user = undefined; // No user on request
      const authorizeMiddleware = authorize([UserRole.ADMIN]);

      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.FORBIDDEN);
      expect(error.message).toBe('Forbidden');
    });

    it('should throw ApiError if user does not have required role', () => {
      mockRequest.user = { id: 'user123', email: 'test@example.com', role: UserRole.USER };
      const authorizeMiddleware = authorize([UserRole.ADMIN]); // Requires ADMIN, user is USER

      authorizeMiddleware(mockRequest as AuthenticatedRequest, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.any(ApiError)
      );
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.statusCode).toBe(StatusCodes.FORBIDDEN);
      expect(error.message).toBe('You do not have permission to perform this action');
    });
  });
});