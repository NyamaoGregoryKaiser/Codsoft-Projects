```javascript
const logger = require('../utils/logger');

/**
 * Middleware to log incoming HTTP requests.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const loggerMiddleware = (req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} from IP: ${req.ip}`);
  next();
};

module.exports = loggerMiddleware;
```