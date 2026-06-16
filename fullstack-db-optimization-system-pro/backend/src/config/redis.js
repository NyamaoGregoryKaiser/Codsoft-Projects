```javascript
const redis = require('redis');
const logger = require('../utils/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = redis.createClient({
  url: REDIS_URL,
});

redisClient.on('connect', () => logger.info('Redis client connected to server'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));
redisClient.on('ready', () => logger.info('Redis client ready!'));
redisClient.on('end', () => logger.info('Redis client disconnected.'));

module.exports = redisClient;
```