const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { db } = require('../config/db');

const auth = (roles = []) => async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await db('users').where({ id: decoded.sub }).first();

    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found or invalid token');
    }

    // Check if user has required roles
    if (roles.length && !roles.includes(user.role)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access');
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired token'));
    }
    next(error);
  }
};

module.exports = auth;