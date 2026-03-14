```javascript
const jwt = require('jsonwebtoken');
const asyncHandler = require('./async');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const logger = require('../config/winston');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }
  // else if (req.cookies.token) {
  //   // Set token from cookie
  //   token = req.cookies.token;
  // }

  // Make sure token exists
  if (!token) {
    logger.warn('No token provided, access denied');
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    logger.debug(`JWT decoded: ${JSON.stringify(decoded)}`);

    req.user = await User.findById(decoded.id);

    if (!req.user) {
      logger.error(`User with ID ${decoded.id} not found after token verification`);
      return next(new ErrorResponse('User not found, not authorized', 401));
    }
    
    next();
  } catch (err) {
    logger.error(`JWT verification failed: ${err.message}`);
    return next(new ErrorResponse('Not authorized to access this route', 401));
  }
});

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) { // Assuming a 'role' field in User model for admin, etc.
      logger.warn(`User ${req.user.id} with role ${req.user.role} tried to access restricted route`);
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};

// Async handler to wrap controller functions and catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```