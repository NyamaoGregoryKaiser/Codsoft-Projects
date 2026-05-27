```javascript
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.JWT_SECRET);

      // Attach user to the request object, excluding password
      req.user = await User.findByPk(decoded.id);

      if (!req.user) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found for this token');
      }

      next();
    } catch (error) {
      logger.warn(`Authentication failed: ${error.message}`);
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, token failed'));
    }
  }

  if (!token) {
    return next(new ApiError(httpStatus.UNAUTHORIZED, 'Not authorized, no token'));
  }
};

const authorize = (roles = []) => {
  // roles can be a single role string (e.g., 'admin') or an array of roles (e.g., ['admin', 'editor'])
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      // This should ideally be caught by 'protect' middleware before 'authorize'
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required'));
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ApiError(httpStatus.FORBIDDEN, `User role (${req.user.role}) is not authorized to access this resource`));
    }

    next();
  };
};

module.exports = {
  protect,
  authorize,
};
```