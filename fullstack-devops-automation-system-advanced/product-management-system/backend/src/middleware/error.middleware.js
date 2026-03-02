const httpStatus = require('http-status');
const config = require('../config');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Converts non-ApiError errors to ApiError.
 * @param {Error} err - The error object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

/**
 * Handles and sends back error response.
 * @param {ApiError} err - The ApiError object.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack })
  };

  if (config.env === 'development') {
    logger.error(err);
  } else {
    logger.error(err.message, { stack: err.stack, code: statusCode });
  }

  res.status(statusCode).send(response);
};

module.exports = {
  errorConverter,
  errorHandler
};
```

```