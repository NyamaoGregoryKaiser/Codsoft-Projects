const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
  let statusCode = err instanceof APIError ? err.statusCode : 500;
  let message = err instanceof APIError ? err.message : 'Internal Server Error';

  // Log the error
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) {
    logger.error(err.stack);
  }

  // Handle specific database errors (example: unique constraint violation)
  if (err.code === '23505') { // PostgreSQL unique violation error code
    statusCode = 409;
    message = 'Duplicate entry found. This resource already exists.';
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON payload received.';
  }

  res.status(statusCode).json({
    message: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Only show stack in dev
  });
};

module.exports = { errorHandler };