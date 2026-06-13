const logger = require('../utils/logger');
const { ValidationError } = require('sequelize');

/**
 * Custom Error Class for API specific errors
 * @extends Error
 */
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Handle 404 Not Found errors.
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const notFound = (req, res, next) => {
  next(new ApiError(404, `Not Found - ${req.originalUrl}`));
};

/**
 * Global error handling middleware.
 * @param {Error} err - The error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  let isOperational = err.isOperational;

  // If the error is not an ApiError and not operational, hide internal details in production
  if (!(err instanceof ApiError) && process.env.NODE_ENV === 'production') {
    statusCode = 500;
    message = 'Internal Server Error';
    isOperational = false;
  }

  // Handle Sequelize validation errors
  if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.errors.map(e => e.message).join(', ');
    isOperational = true;
  }

  // Log the error
  const errorLog = {
    statusCode,
    message,
    stack: err.stack,
    isOperational,
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  };

  if (statusCode === 500 && isOperational === false) { // Log 500 errors to error log
    logger.error('Caught unhandled error:', errorLog);
  } else {
    logger.warn('Caught operational error:', errorLog); // Log other operational errors
  }

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Include stack in dev
  });
};

module.exports = {
  ApiError,
  notFound,
  errorHandler,
};