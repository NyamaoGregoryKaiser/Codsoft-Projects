const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');
const config = require('../config');

// API rate limiter configuration
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests,   // limit each IP to 100 requests per windowMs
  standardHeaders: true,               // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,                // Disable the `X-RateLimit-*` headers
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after a minute'
  },
  // Use a custom key generator if you need different rate limits per user, etc.
  // keyGenerator: (req, res) => req.user ? req.user.id : req.ip,
  // store: new RedisStore({
  //   client: redisClient, // Your Redis client instance
  //   expiry: config.rateLimit.windowMs / 1000, // in seconds
  //   prefix: 'rl:'
  // })
});

module.exports = { apiLimiter };
```

```