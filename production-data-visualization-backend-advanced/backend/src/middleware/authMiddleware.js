const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const AppError = require('../utils/AppError');
const User = require('../models/user');
const config = require('../config/config');

exports.protect = async (req, res, next) => {
  try {
    let token;
    // 1) Check if token exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verify token
    const decoded = await promisify(jwt.verify)(token, config.jwtSecret);

    // 3) Check if user still exists
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    // 4) Check if user changed password after the token was issued
    // This requires a passwordChangedAt field on the User model
    // if (currentUser.changedPasswordAfter(decoded.iat)) {
    //   return next(new AppError('User recently changed password! Please log in again.', 401));
    // }

    // Grant access to protected route
    req.user = currentUser;
    next();
  } catch (err) {
    next(err);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};