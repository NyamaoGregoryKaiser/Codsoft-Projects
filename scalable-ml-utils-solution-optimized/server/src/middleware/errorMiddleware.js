const logger = require('../utils/logger');
const AppError = require('../utils/appError');
const { NODE_ENV } = require('../config');

// Handle 404 Not Found errors
exports.notFoundHandler = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

// General error handling middleware
exports.errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong';

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  // Handle specific errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Not authorized, invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, token expired';
  }
  if (err.name === 'PrismaClientKnownRequestError') {
    if (err.code === 'P2002') { // Unique constraint violation
      statusCode = 409;
      message = `Duplicate field value: ${err.meta.target}`;
    }
    // Add other Prisma error codes as needed
  }
  if (err.name === 'MulterError') {
    statusCode = 400;
    message = `File upload error: ${err.message}`;
  }

  res.status(statusCode).json({
    message: message,
    // Include stack trace only in development
    stack: NODE_ENV === 'production' ? null : err.stack,
  });
};