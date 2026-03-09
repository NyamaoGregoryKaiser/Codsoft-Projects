```javascript
const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const { User } = require('../models');
const config = require('../config');

/**
 * Protects routes, ensuring a valid JWT is present.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Attach user to the request object (excluding password)
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });

      if (!req.user) {
        res.status(401);
        throw new Error('Not authorized, user not found');
      }

      next();
    } catch (error) {
      res.status(401);
      throw new Error('Not authorized, token failed: ' + error.message);
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

/**
 * Middleware to restrict access to specific roles.
 * Usage: authorizeRoles('admin', 'manager')
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role ${req.user ? req.user.role : 'unauthenticated'} is not authorized to access this route.`);
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
```