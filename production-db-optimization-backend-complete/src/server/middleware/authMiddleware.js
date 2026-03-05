const jwt = require('jsonwebtoken');
const userService = require('../services/userService');
const { APIError } = require('../utils/apiError');
const logger = require('../utils/logger');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await userService.findUserById(decoded.id);
      if (!req.user) {
        throw new APIError('User not found.', 401);
      }
      next();
    } catch (error) {
      logger.error('Auth failed:', error.message);
      next(new APIError('Not authorized, token failed', 401));
    }
  }
  if (!token) {
    next(new APIError('Not authorized, no token', 401));
  }
};

const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    if (!req.user || (roles.length > 0 && !roles.includes(req.user.role))) {
      return next(new APIError('Not authorized to access this route', 403));
    }
    next();
  };
};

module.exports = { protect, authorize };