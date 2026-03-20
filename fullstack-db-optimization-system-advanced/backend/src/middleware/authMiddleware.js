const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const prisma = require('@config/db');
const config = require('@config');
const logger = require('@utils/logger');

/**
 * Protects routes, ensures user is authenticated.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Attach user to request object
      req.user = await prisma.user.findUnique({
        where: { id: decoded.id },
        select: { id: true, username: true, role: true }, // Select specific fields
      });

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      logger.error('Authentication error:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Authorizes access based on user roles.
 * @param {string[]} roles - An array of roles that are allowed to access the route.
 */
const authorize = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, no user found in request');
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: You do not have permission to access this resource');
    }
    next();
  };
};

module.exports = { protect, authorize };