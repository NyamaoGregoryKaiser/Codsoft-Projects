```javascript
const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const { User } = require('../models');
const AppError = require('../utils/appError');
const config = require('../config');
const catchAsync = require('../utils/catchAsync');

const protect = catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401));
  }

  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, config.jwt.secret);

  // 3) Check if user still exists
  const currentUser = await User.findByPk(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  // Grant access to protected route
  req.user = currentUser;
  req.token = token; // Optionally attach token for other middleware
  next();
});

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

module.exports = {
  protect,
  authorize,
};
```