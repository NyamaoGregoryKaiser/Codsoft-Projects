```javascript
// server/src/middleware/rateLimitMiddleware.js
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status-codes');
const logger = require('../config/logger');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 failed login attempts per IP per 15 minutes
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many login attempts from this IP, please try again after 15 minutes',
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  apiLimiter,
  authLimiter,
};

```