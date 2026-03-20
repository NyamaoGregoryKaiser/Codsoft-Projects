const logger = require('@utils/logger');
const config = require('@config');

/**
 * Express error handling middleware.
 * Catches errors thrown by async handlers and formats responses.
 * @param {Error} err - The error object.
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    method: req.method,
    path: req.path,
    stack: err.stack,
    ip: req.ip,
    user: req.user ? req.user.id : 'N/A',
  });

  // Determine status code
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    message: err.message,
    // Only send stack trace in development
    stack: config.env === 'development' ? err.stack : undefined,
    success: false,
    errorType: err.name,
  });
};

module.exports = errorHandler;