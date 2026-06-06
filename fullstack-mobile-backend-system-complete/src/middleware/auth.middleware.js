```javascript
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const config = require('../config');
const userService = require('../modules/users/user.service');

/**
 * Middleware to authenticate user using JWT.
 * Attaches user object to `req.user` if authenticated.
 */
const authenticate = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    if (payload.type !== 'access') {
      throw new Error('Invalid token type');
    }

    const user = await userService.getUserById(payload.sub);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found or token expired');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Access token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid access token');
    } else if (error instanceof ApiError) {
      throw error; // Re-throw custom ApiError
    } else {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed');
    }
  }
});

/**
 * Middleware to check user authorization based on roles.
 * @param {Array<string>} requiredRoles - Array of roles allowed to access the route (e.g., ['admin', 'user'])
 */
const authorize = (requiredRoles = []) => (req, res, next) => {
  if (!req.user) {
    // This should ideally not happen if 'authenticate' middleware runs before 'authorize'
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required for authorization check');
  }

  if (requiredRoles.length && !requiredRoles.includes(req.user.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden');
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
};
```