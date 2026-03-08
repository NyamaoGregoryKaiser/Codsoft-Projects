```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('express-rate-limit-redis');
const { createClient } = require('redis');
const config = require('../config');
const logger = require('../utils/logger');
const httpStatus = require('http-status');

// Initialize Redis client for rate limiting
const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
});

redisClient.on('error', (err) => logger.error('Redis Rate Limit Client Error:', err));

// Connect to Redis only once when this module is loaded
(async () => {
  await redisClient.connect();
})();

const rateLimitMiddleware = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'pms:ratelimit:',
  }),
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Max requests per windowMs
  message: {
    code: httpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests, please try again after a minute',
  },
  headers: true, // Enable `RateLimit-*` headers
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = {
  rateLimitMiddleware,
};
```