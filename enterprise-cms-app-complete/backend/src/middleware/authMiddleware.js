const { verifyToken } = require('../utils/jwt');
const { ApiError } = require('./errorHandler');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware to authenticate user via JWT.
 * Attaches decoded user payload to req.user.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @throws {ApiError} 401 if no token or invalid token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication token missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token); // Throws error if invalid/expired

    const user = await User.findByPk(decoded.id);
    if (!user) {
      throw new ApiError(401, 'User not found for this token');
    }

    // Attach user information to the request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
    };
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error.message);
    next(new ApiError(error.message === 'Token expired' ? 401 : 403, error.message));
  }
};

/**
 * Middleware to authorize user based on roles.
 * @param {string[]} allowedRoles - Array of roles allowed to access the route.
 * @returns {function} Express middleware
 * @throws {ApiError} 403 if user does not have an allowed role
 */
const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    // This should ideally not happen if authenticate runs before authorize
    return next(new ApiError(401, 'User role not found. Please authenticate first.'));
  }

  if (!allowedRoles.includes(req.user.role)) {
    return next(new ApiError(403, 'Forbidden: You do not have the necessary permissions.'));
  }

  next();
};

module.exports = {
  authenticate,
  authorize,
};