const { verifyToken } = require('../utils/jwt');
const config = require('../config');
const knex = require('../database/knexfile');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required: No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = await verifyToken(token, config.JWT_SECRET);

    // Ensure token type is 'access'
    if (decoded.type !== 'access') {
      return res.status(401).json({ message: 'Invalid token type.' });
    }

    // Check if user still exists
    const user = await knex('users').where({ id: decoded.sub }).first();
    if (!user) {
      return res.status(401).json({ message: 'User belonging to this token no longer exists.' });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Authentication required: Token expired.' });
    }
    return res.status(401).json({ message: 'Authentication required: Invalid token.' });
  }
};

const authorize = (roles = []) => {
  // roles can be a single role or an array of roles
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      // This case should ideally not happen if 'authenticate' middleware runs before 'authorize'
      return res.status(401).json({ message: 'Authentication required.' });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission to perform this action.' });
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};