```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../config/winston');

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10), // Max requests per windowMs
  message: 'Too many requests from this IP, please try again after a minute',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}. Endpoint: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
  keyGenerator: (req, res) => {
    // Use X-Forwarded-For if behind a proxy, otherwise req.ip
    return req.headers['x-forwarded-for'] || req.ip;
  }
});

module.exports = limiter;
```