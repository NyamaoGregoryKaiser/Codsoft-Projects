```javascript
const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const start = process.hrtime.bigint();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1_000_000; // Convert nanoseconds to milliseconds
    const { statusCode } = res;
    logger.info(`${method} ${originalUrl} - ${statusCode} - ${duration.toFixed(2)}ms - IP: ${ip}`);
  });
  next();
};

module.exports = requestLogger;
```