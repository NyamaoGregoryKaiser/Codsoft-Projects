```javascript
const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const { redisClient } = require('../config/redis');
const { RedisStore } = require('express-rate-limit-redis'); // Not in dependencies, would need to add. For this example, let's assume direct Redis is configured.

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: 'Too many authentication attempts from this IP, please try again after an hour',
  // store: new RedisStore({
  //   sendCommand: (...args) => redisClient.sendCommand(args),
  // }),
  // Using default MemoryStore for simplicity, replace with RedisStore for production.
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
  authLimiter,
};
```