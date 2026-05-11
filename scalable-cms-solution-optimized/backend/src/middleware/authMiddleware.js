const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware to verify JWT token and attach user to request.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Attach user from token to the request object (excluding password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        logger.warn(`Authentication failed: User with ID ${decoded.id} not found.`);
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      logger.error('Authentication error:', error.message);
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    logger.warn('Authentication failed: No token provided.');
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

/**
 * Middleware for role-based authorization.
 * @param {string[]} roles - An array of roles that are allowed to access the route.
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles]; // Ensure roles is an array
  }

  return (req, res, next) => {
    if (!req.user) {
      // This should ideally be caught by 'protect' middleware before this one.
      logger.error('Authorization failed: No user found on request. Is protect middleware missing?');
      return res.status(500).json({ message: 'Internal server error: User not authenticated.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      logger.warn(`Authorization denied: User ${req.user.username} (role: ${req.user.role}) attempted to access resource requiring roles: ${roles.join(', ')}`);
      return res.status(403).json({ message: `Forbidden: User role '${req.user.role}' is not allowed to access this resource.` });
    }
    next();
  };
};

module.exports = { protect, authorize };
```