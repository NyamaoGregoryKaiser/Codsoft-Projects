```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const { User, Role } = require('../db/models');

/**
 * Middleware to authenticate user via JWT token.
 * Sets `req.user` with decoded user information.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authMiddleware = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    logger.warn('Auth attempt without token.');
    return next(createError(401, 'Not authorized, no token provided'));
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    logger.debug(`Token decoded for user ID: ${decoded.id}`);

    // Attach user to the request object, fetching from DB to ensure it's a current user
    // Exclude password and include Role details
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'Role', attributes: ['name'] }]
    });

    if (!user) {
      logger.warn(`Auth attempt with token for non-existent user ID: ${decoded.id}`);
      return next(createError(401, 'Not authorized, user not found'));
    }

    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      roleId: user.roleId,
      role: user.Role ? user.Role.name : 'Guest' // Attach role name for permission checks
    };
    next();
  } catch (error) {
    logger.error('JWT authentication failed:', error.message);
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expired'));
    }
    return next(createError(401, 'Not authorized, token failed'));
  }
};

module.exports = authMiddleware;
```