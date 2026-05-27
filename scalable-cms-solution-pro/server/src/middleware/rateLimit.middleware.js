```javascript
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const logger = require('../utils/logger');

const setupRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per 15 minutes
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

const authRateLimit = () => rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per 15 minutes
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Generate a key based on IP and email for login attempts
    return `${req.ip}-${req.body.email || ''}`;
  },
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, email: ${req.body.email}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  setupRateLimit,
  authRateLimit, // Can be applied specifically to auth routes like POST /api/v1/auth/login
};
```