```javascript
const { createClient } = require('redis');
const config = require('../config');
const logger = require('./logger');

let redisClient;

/**
 * Initializes the Redis client.
 * Connects to Redis server specified in config.
 */
const initializeRedis = async () => {
  redisClient = createClient({
    url: config.redis.url,
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
  redisClient.on('connect', () => logger.info('Redis client connected'));
  redisClient.on('ready', () => logger.info('Redis client ready'));
  redisClient.on('end', () => logger.info('Redis client disconnected'));

  try {
    // Only connect if not already connected
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
  } catch (err) {
    logger.error('Could not connect to Redis:', err);
    // Depending on your application's needs, you might want to exit the process
    // or handle this more gracefully if Redis is not critical for startup.
  }
};

/**
 * Returns the initialized Redis client instance.
 * @returns {RedisClientType} The Redis client instance.
 */
const getRedisClient = () => {
  if (!redisClient) {
    // Attempt to initialize if not already, though server.js should handle initial connect
    initializeRedis();
  }
  return redisClient;
};

// Export functions to manage connection and the client instance
module.exports = {
  connect: initializeRedis,
  disconnect: async () => {
    if (redisClient && redisClient.isReady) {
      await redisClient.quit(); // Use quit to gracefully close
    }
  },
  get: async (key) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        logger.warn('Redis client not ready for GET operation.');
        return null;
      }
      return await redisClient.get(key);
    } catch (error) {
      logger.error(`Redis GET error for key ${key}: ${error.message}`);
      return null;
    }
  },
  setEx: async (key, ttlSeconds, value) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        logger.warn('Redis client not ready for SETEX operation.');
        return null;
      }
      return await redisClient.setEx(key, ttlSeconds, value);
    } catch (error) {
      logger.error(`Redis SETEX error for key ${key}: ${error.message}`);
      return null;
    }
  },
  del: async (key) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        logger.warn('Redis client not ready for DEL operation.');
        return null;
      }
      // Handle single key or array of keys
      return await redisClient.del(key);
    } catch (error) {
      logger.error(`Redis DEL error for key ${key}: ${error.message}`);
      return null;
    }
  },
  keys: async (pattern) => {
    try {
      if (!redisClient || !redisClient.isReady) {
        logger.warn('Redis client not ready for KEYS operation.');
        return [];
      }
      return await redisClient.keys(pattern);
    } catch (error) {
      logger.error(`Redis KEYS error for pattern ${pattern}: ${error.message}`);
      return [];
    }
  },
};
```