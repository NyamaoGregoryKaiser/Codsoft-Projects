```javascript
const logger = require('../utils/logger');

/**
 * Middleware for logging incoming requests.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const loggingMiddleware = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      // userId: req.user ? req.user.id : 'N/A' // Uncomment if user is always authenticated
    });
  });
  next();
};

module.exports = loggingMiddleware;
```