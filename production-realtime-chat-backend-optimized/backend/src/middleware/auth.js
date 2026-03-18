```javascript
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const { userService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const auth = (...requiredRoles) =>
  catchAsync(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    const user = await userService.getUserById(decoded.sub);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found for this token');
    }

    // Check for required roles
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
    }

    req.user = user;
    next();
  });

module.exports = auth;
```