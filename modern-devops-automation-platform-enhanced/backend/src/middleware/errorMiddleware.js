```javascript
const logger = require('../utils/logger');
const config = require('../config/env');

const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Log error with stack trace for server-side debugging
  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
    logger.error(err.stack);
  }

  // Handle specific Sequelize errors or custom errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; // Conflict
    message = 'Resource already exists with unique constraint. ' + err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400; // Bad Request
    message = 'Validation error: ' + err.errors.map(e => e.message).join(', ');
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400; // Bad Request
    message = 'Referenced resource does not exist or cannot be modified: ' + err.message;
  }
  else if (message.includes('Not authorized')) { // Custom auth error message
    statusCode = 401;
  } else if (message.includes('Unauthorized')) { // Custom auth error message
    statusCode = 403;
  } else if (message.includes('not found')) { // Custom not found error message
    statusCode = 404;
  }

  res.status(statusCode).json({
    message: message,
    stack: config.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
```