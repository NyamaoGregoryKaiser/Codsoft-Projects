```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config');

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // 100 requests per 1 minute
  message: 'Too many requests from this IP, please try again after 1 minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = authLimiter;
```