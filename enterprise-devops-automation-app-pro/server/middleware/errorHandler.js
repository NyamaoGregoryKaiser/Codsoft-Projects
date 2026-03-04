const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log the error using Winston
  logger.error(`Error: ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack,
    cause: err.cause,
  });

  // Determine status code
  const statusCode = err.cause && typeof err.cause === 'number' && err.cause >= 400 && err.cause < 600
    ? err.cause
    : 500;

  // Determine operational status
  const isOperational = err.isOperational || statusCode < 500; // All 4xx errors are operational

  // Send a generic message for production errors that are not operational
  const message = (process.env.NODE_ENV === 'production' && !isOperational)
    ? 'Something went wrong!'
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    // Include stack trace only in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;