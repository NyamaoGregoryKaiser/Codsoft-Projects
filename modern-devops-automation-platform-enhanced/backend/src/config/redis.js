```javascript
const redis = require('redis');
const config = require('./env');
const logger = require('../utils/logger');

const redisClient = redis.createClient({
  socket: {
    host: config.REDIS_HOST,
    port: config.REDIS_PORT
  },
  password: config.REDIS_PASSWORD || undefined, // Only pass if a password is set
});

redisClient.on('connect', () => {
  logger.info('Redis client connected to server');
});

redisClient.on('ready', () => {
  logger.info('Redis client is ready');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
});

redisClient.on('end', () => {
  logger.warn('Redis client disconnected from server');
});

const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    // Continue without caching if Redis is unavailable, or exit if critical
    // process.exit(1); // Uncomment to make Redis critical
  }
};

const disconnectRedis = async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected.');
  }
};

module.exports = { redisClient, connectRedis, disconnectRedis };
```