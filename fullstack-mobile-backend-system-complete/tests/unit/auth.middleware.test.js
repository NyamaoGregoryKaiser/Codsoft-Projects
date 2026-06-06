```javascript
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../../src/middleware/auth.middleware');
const ApiError = require('../../src/utils/ApiError');
const userService = require('../../src/modules/users/user.service');
const config = require('../../src/config');
const { generateToken } = require('../../src/config/jwt'); // For creating valid/invalid tokens
const moment = require('moment');

// Mock userService methods
jest.mock('../../src/modules/users/user.service');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null, // Simulate initial state before auth
    };
    res = {}; // No response needed for middleware
    next = jest.fn(); // Mock next to check if it's called
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should call next() if token is valid and user exists', async () => {
      const mockUser = { id: 'user123', email: 'test@example.com', role: 'USER' };
      const token = generateToken(mockUser.id, moment().add(10, 'minutes'), 'access');
      req.headers.authorization = `Bearer ${token}`;
      userService.getUserById.mockResolvedValue(mockUser);

      await authenticate(req, res, next);

      expect(userService.getUserById).toHaveBeenCalledWith(mockUser.id);
      expect(req.user).toEqual(mockUser);
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError (401) if no authorization header', async () => {
      await expect(authenticate(req, res, next)).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required')
      );
      expect(next).not.toHaveBeenCalled();
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw ApiError (401) if token is malformed', async () => {
      req.headers.authorization = 'Bearer malformed-token';
      await expect(authenticate(req, res, next)).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Invalid access token')
      );
      expect(next).not.toHaveBeenCalled();
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw ApiError (401) if token is expired', async () => {
      // Create an expired token
      const expiredToken = jwt.sign({ sub: 'user123', type: 'access', exp: moment().subtract(1, 'minute').unix() }, config.jwt.secret);
      req.headers.authorization = `Bearer ${expiredToken}`;

      await expect(authenticate(req, res, next)).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Access token expired')
      );
      expect(next).not.toHaveBeenCalled();
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw ApiError (401) if token type is not "access"', async () => {
      const refreshToken = generateToken('user123', moment().add(10, 'minutes'), 'refresh');
      req.headers.authorization = `Bearer ${refreshToken}`;

      await expect(authenticate(req, res, next)).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed') // Generic error for invalid token type via generic catch
      );
      expect(next).not.toHaveBeenCalled();
      expect(userService.getUserById).not.toHaveBeenCalled();
    });

    it('should throw ApiError (401) if user does not exist', async () => {
      const token = generateToken('nonexistentUserId', moment().add(10, 'minutes'), 'access');
      req.headers.authorization = `Bearer ${token}`;
      userService.getUserById.mockResolvedValue(null); // User not found

      await expect(authenticate(req, res, next)).rejects.toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'User not found or token expired')
      );
      expect(userService.getUserById).toHaveBeenCalledWith('nonexistentUserId');
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should call next() if user has required role (single role)', () => {
      req.user = { id: 'user123', role: 'ADMIN' };
      const middleware = authorize(['ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next() if user has required role (multiple roles)', () => {
      req.user = { id: 'user123', role: 'USER' };
      const middleware = authorize(['USER', 'ADMIN']);

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should throw ApiError (403) if user does not have required role', () => {
      req.user = { id: 'user123', role: 'USER' };
      const middleware = authorize(['ADMIN']);

      expect(() => middleware(req, res, next)).toThrow(
        new ApiError(httpStatus.FORBIDDEN, 'Access forbidden')
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should throw ApiError (401) if req.user is not set (authenticate not run)', () => {
      req.user = null; // No user attached
      const middleware = authorize(['ADMIN']);

      expect(() => middleware(req, res, next)).toThrow(
        new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required for authorization check')
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if no roles are required', () => {
      req.user = { id: 'user123', role: 'USER' };
      const middleware = authorize([]); // No specific roles required

      middleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
```