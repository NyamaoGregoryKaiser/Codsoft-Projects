const passport = require('passport'); // Not using passport directly, but conceptually it's an auth middleware
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/jwt');
const config = require('../config/config');
const db = require('../models');
const catchAsync = require('../utils/catchAsync');

const auth = (...requiredRoles) => catchAsync(async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }

  try {
    const payload = verifyToken(token, config.jwt.secret);
    const user = await db.User.findByPk(payload.sub);

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    req.user = user; // Attach user to request

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: Insufficient permissions');
    }

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Token expired');
    }
    if (err.name === 'JsonWebTokenError') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token');
    }
    next(err); // Pass other errors to error handling middleware
  }
});

module.exports = auth;