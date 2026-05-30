```javascript
const { createClient } = require('redis');
const config = require('../config');
const logger = require('../config/logger.config');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
      password: config.redis.password,
    });

    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Redis Client Connected!'));

    await redisClient.connect();
    logger.info('Connected to Redis successfully!');
  } catch (error) {
    logger.error('Could not connect to Redis:', error);
    // In a real production app, decide if this is a fatal error or if the app can run without caching
    // For now, allow the app to run without caching if Redis is down
  }
};

// Initialize Redis connection on startup
connectRedis();

const cache = {
  get: async (key) => {
    if (!redisClient || !redisClient.isReady) {
      logger.warn('Redis client not ready, cannot get from cache.');
      return null;
    }
    return await redisClient.get(key);
  },
  set: async (key, value, ...args) => {
    if (!redisClient || !redisClient.isReady) {
      logger.warn('Redis client not ready, cannot set to cache.');
      return;
    }
    await redisClient.set(key, value, ...args);
  },
  del: async (key) => {
    if (!redisClient || !redisClient.isReady) {
      logger.warn('Redis client not ready, cannot delete from cache.');
      return;
    }
    await redisClient.del(key);
  },
  // Invalidate all keys matching a pattern (e.g., 'all_projects*')
  invalidateCache: async (pattern) => {
    if (!redisClient || !redisClient.isReady) {
      logger.warn('Redis client not ready, cannot invalidate cache.');
      return;
    }
    const keys = await redisClient.keys(`${pattern}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Invalidated ${keys.length} keys matching pattern: ${pattern}`);
    }
  },
};

module.exports = cache;
```