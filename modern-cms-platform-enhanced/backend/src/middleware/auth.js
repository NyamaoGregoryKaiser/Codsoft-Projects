```javascript
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const auth = (...requiredRoles) => async (req, res, next) => {
  try {
    const token = req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication token missing');
    }

    const payload = jwt.verify(token, config.jwt.secret);

    const user = await User.findByPk(payload.sub);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    req.user = user;

    if (requiredRoles.length) {
      if (!requiredRoles.includes(user.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Access forbidden: Insufficient permissions');
      }
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Token expired'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    }
    next(error);
  }
};

module.exports = auth;
```