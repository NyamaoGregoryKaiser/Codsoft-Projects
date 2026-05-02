```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const logger = require('../utils/logger');

const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: config.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on route ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
```