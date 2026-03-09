```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Middleware for API rate limiting.
 * Prevents brute-force attacks and ensures fair usage.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Max requests per windowMs per IP
  message: {
    message: 'Too many requests from this IP, please try again after a minute',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
```