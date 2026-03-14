```javascript
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Custom Error class for HTTP errors.
 */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Helper function to create HttpError instances.
 * @param {number} statusCode - HTTP status code.
 * @param {string} message - Error message.
 * @returns {HttpError} An instance of HttpError.
 */
exports.createError = (statusCode, message) => {
  return new HttpError(statusCode, message);
};

/**
 * Centralized error handling middleware.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Specific error handling for common errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; // Conflict
    message = err.errors.map(e => e.message).join(', ') || 'Duplicate entry.';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400; // Bad Request
    message = err.errors.map(e => e.message).join(', ') || 'Validation failed.';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Invalid token, please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Unauthorized
    message = 'Token has expired, please log in again.';
  } else if (err.name === 'CastError') { // Mongoose specific, but good for similar DB errors
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  } else if (err.code === 'LIMIT_FILE_SIZE') { // Multer error for file size
    statusCode = 413;
    message = 'File size is too large.';
  } else if (err.code === 'LIMIT_UNEXPECTED_FILE') { // Multer error for unexpected field
    statusCode = 400;
    message = 'Unexpected file field.';
  }

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    error: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user ? req.user.id : 'unauthenticated'
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: config.env === 'development' ? err.stack : undefined, // Include stack only in dev
    message: message,
  });
};
```