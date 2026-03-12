```javascript
const logger = require('../utils/logger');

/**
 * Centralized error handling middleware.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(`Error encountered: ${err.message}`, {
    method: req.method,
    path: req.path,
    stack: err.stack,
    // Add more context if needed, e.g., user ID, request body
  });

  // Determine status code
  let statusCode = err.statusCode || 500;

  // Specific handling for certain types of errors
  if (err.name === 'ValidationError') {
    statusCode = 400; // Bad Request
  } else if (err.name === 'UnauthorizedError' || err.message === 'Invalid authentication token.' || err.message === 'Authentication token has expired.') {
    statusCode = 401; // Unauthorized
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403; // Forbidden
  } else if (err.name === 'NotFoundError') {
    statusCode = 404; // Not Found
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; // Conflict
    err.message = 'Resource already exists.';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400; // Bad Request
    err.message = err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400; // Bad Request
    err.message = 'Related resource not found or cannot be deleted.';
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    message: err.message || 'An unexpected error occurred.',
    // In production, avoid sending stack trace to client
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
```