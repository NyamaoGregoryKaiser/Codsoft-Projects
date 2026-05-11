const logger = require('../utils/logger');
const { ValidationError } = require('sequelize');

/**
 * Centralized error handling middleware.
 * Catches errors from routes and other middleware, logs them, and sends a standardized response.
 * @param {Error} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = [];

  // Log the full error for debugging, especially 500 errors
  if (statusCode === 500) {
    logger.error(`[${req.method} ${req.originalUrl}] Server Error: ${err.message}`, {
      stack: err.stack,
      requestBody: req.body,
      query: req.query,
      params: req.params,
      user: req.user ? req.user.id : 'N/A'
    });
  } else {
    logger.warn(`[${req.method} ${req.originalUrl}] Client Error (${statusCode}): ${err.message}`, {
      requestBody: req.body,
      query: req.query,
      params: req.params,
      user: req.user ? req.user.id : 'N/A'
    });
  }

  // Handle specific types of errors
  if (err instanceof ValidationError) {
    statusCode = 400; // Bad Request
    message = 'Validation Error';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message,
      value: e.value
    }));
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401; // Unauthorized
    message = 'Invalid token, please log in again';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401; // Unauthorized
    message = 'Token has expired, please log in again';
  } else if (err.code === 'P2002' && err.meta && err.meta.target) { // Example for Prisma unique constraint, adjust for Sequelize
    statusCode = 409; // Conflict
    message = `A record with this ${err.meta.target.join(', ')} already exists.`;
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; // Conflict
    message = err.errors[0].message || 'A record with this unique field already exists.';
    errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400; // Bad Request
    message = 'Associated resource not found or cannot be deleted due to existing relationships.';
    errors = [{ message: err.message }];
  } else if (err.name === 'NotFoundError') { // Custom error for not found resources
    statusCode = 404;
    message = err.message;
  }


  // Send error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message: message,
    errors: errors.length > 0 ? errors : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Provide stack only in dev
  });
};

module.exports = errorHandler;
```