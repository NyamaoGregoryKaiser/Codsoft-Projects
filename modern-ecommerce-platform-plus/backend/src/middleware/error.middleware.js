const config = require('../config');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (config.NODE_ENV === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Internal Server Error';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (config.NODE_ENV === 'development') {
    logger.error(err);
  } else {
    logger.error(`Error: ${statusCode} - ${message} - ${err.stack}`);
  }

  res.status(statusCode).send(response);
};

module.exports = errorHandler;