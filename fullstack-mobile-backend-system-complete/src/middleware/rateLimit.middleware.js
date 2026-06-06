```javascript
const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const config = require('../config');

/**
 * API rate limiter middleware.
 * Limits repetitive requests to public APIs to prevent abuse.
 * Configured via environment variables.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMinutes * 60 * 1000, // Time window in milliseconds
  max: config.rateLimit.maxRequests, // Max requests per window per IP
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after some time.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = apiLimiter;
```