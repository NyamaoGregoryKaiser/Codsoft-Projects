```javascript
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

const auth = (...requiredRoles) => async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await User.findByPk(decoded.sub);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    // Check if user has required roles
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token'));
    }
    next(error);
  }
};

module.exports = auth;
```