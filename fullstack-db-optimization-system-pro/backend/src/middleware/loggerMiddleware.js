```javascript
const logger = require('../utils/logger');

const logRequest = (req, res, next) => {
  const { method, originalUrl, ip } = req;
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const diff = process.hrtime.bigint() - startTime;
    const durationMs = Number(diff / 1_000_000n); // Convert nanoseconds to milliseconds

    logger.info({
      message: 'HTTP Request',
      method,
      url: originalUrl,
      ip,
      statusCode: res.statusCode,
      durationMs,
      userId: req.user ? req.user.id : 'guest',
    });
  });
  next();
};

const logError = (err, req, res, next) => {
  logger.error({
    message: 'HTTP Error',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    statusCode: err.statusCode || 500,
    errorName: err.name,
    errorMessage: err.message,
    stack: err.stack,
    userId: req.user ? req.user.id : 'guest',
  });
  next(err); // Pass error to the next error handler (errorHandler)
};

module.exports = { logRequest, logError };
```