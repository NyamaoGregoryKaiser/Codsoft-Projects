```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
    message = err.message || httpStatus[statusCode];
    if (statusCode === httpStatus.INTERNAL_SERVER_ERROR) {
      // Log unexpected errors
      logger.error(err);
    }
    err = new ApiError(statusCode, message, false, err.stack);
  }

  const response = {
    code: err.statusCode,
    message: err.message,
    ...(config.NODE_ENV === 'development' && { stack: err.stack }), // Only show stack in development
  };

  res.status(err.statusCode).send(response);
};

module.exports = {
  errorHandler,
};
```