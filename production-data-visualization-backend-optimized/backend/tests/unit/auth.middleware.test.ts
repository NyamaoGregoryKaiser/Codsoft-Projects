```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorizeRoles } from '../../src/middleware/auth.middleware';
import { jwtSecret } from '../../src/config/jwt.config';
import { APIError } from '../../src/utils/error';
import { UserRole } from '../../src/models/User';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(), // Mock setHeader for rateLimit, if present in middleware chain
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should call next with APIError 401 if no token is provided', () => {
      mockRequest.headers = {};
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(APIError));
      expect((mockNext as jest.Mock).mock.calls[0][0].statusCode).toBe(401);
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Authentication token required');
    });

    it('should call next with APIError 403 if token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid_token' };
      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(APIError));
      expect((mockNext as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Invalid or expired token');
    });

    it('should set req.user and call next if token is valid', () => {
      const userPayload = { id: '123', email: 'test@example.com', role: UserRole.User };
      const token = jwt.sign(userPayload, jwtSecret, { expiresIn: '1h' });
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual(userPayload);
      expect(mockNext).toHaveBeenCalledWith(); // Called without arguments for success
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });

  describe('authorizeRoles', () => {
    it('should call next with APIError 401 if req.user is not set', () => {
      mockRequest.user = undefined; // Simulate authenticateToken not running or failing
      const middleware = authorizeRoles(UserRole.Admin);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(APIError));
      expect((mockNext as jest.Mock).mock.calls[0][0].statusCode).toBe(401);
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Unauthorized: User information missing');
    });

    it('should call next with APIError 403 if user role is not authorized', () => {
      mockRequest.user = { id: '123', email: 'test@example.com', role: UserRole.User };
      const middleware = authorizeRoles(UserRole.Admin);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(APIError));
      expect((mockNext as jest.Mock).mock.calls[0][0].statusCode).toBe(403);
      expect((mockNext as jest.Mock).mock.calls[0][0].message).toBe('Forbidden: You do not have the necessary permissions');
    });

    it('should call next if user role is authorized', () => {
      mockRequest.user = { id: '123', email: 'admin@example.com', role: UserRole.Admin };
      const middleware = authorizeRoles(UserRole.Admin);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should call next if user has one of multiple authorized roles', () => {
      mockRequest.user = { id: '123', email: 'test@example.com', role: UserRole.User };
      const middleware = authorizeRoles(UserRole.Admin, UserRole.User);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });
  });
});
```