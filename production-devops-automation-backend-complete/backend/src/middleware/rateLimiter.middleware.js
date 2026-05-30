```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}. Path: ${req.originalUrl}`);
    next(new AppError(options.message, 429));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
```