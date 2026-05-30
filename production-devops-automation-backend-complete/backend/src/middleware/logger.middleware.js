```javascript
const logger = require('../config/logger.config');

const requestLogger = (req, res, next) => {
  const { method, originalUrl, ip } = req;
  const start = process.hrtime();

  res.on('finish', () => {
    const durationInMilliseconds = getDurationInMilliseconds(start);
    const { statusCode } = res;
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(logLevel, `[${ip}] ${method} ${originalUrl} ${statusCode} - ${durationInMilliseconds.toLocaleString()} ms`, {
      method,
      url: originalUrl,
      ip,
      statusCode,
      duration: durationInMilliseconds,
      userId: req.user ? req.user.id : 'guest',
      userAgent: req.headers['user-agent'],
    });
  });

  next();
};

const getDurationInMilliseconds = (start) => {
  const NS_PER_SEC = 1e9;
  const NS_TO_MS = 1e6;
  const diff = process.hrtime(start);
  return (diff[0] * NS_PER_SEC + diff[1]) / NS_TO_MS;
};

module.exports = requestLogger;
```