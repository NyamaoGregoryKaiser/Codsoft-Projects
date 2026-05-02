```javascript
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

const cache = (keyPrefix, ttlSeconds = 3600) => {
  return async (req, res, next) => {
    if (!redisClient.isOpen) {
      logger.warn('Redis client not connected, skipping cache middleware.');
      return next();
    }

    const key = `${keyPrefix}:${req.originalUrl}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${key}`);
        return res.status(200).json(JSON.parse(cachedData));
      } else {
        logger.debug(`Cache miss for key: ${key}`);
        const originalJson = res.json;
        res.json = async (body) => {
          // Only cache successful responses (2xx status codes)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            await redisClient.setEx(key, ttlSeconds, JSON.stringify(body));
            logger.debug(`Cached data for key: ${key}`);
          }
          originalJson.call(res, body);
        };
        next();
      }
    } catch (err) {
      logger.error(`Redis cache error for key ${key}: ${err.message}`);
      next(); // Continue to next middleware if cache fails
    }
  };
};

const clearCache = async (keyPrefix) => {
  if (!redisClient.isOpen) {
    logger.warn('Redis client not connected, skipping cache clear.');
    return;
  }
  try {
    const keys = await redisClient.keys(`${keyPrefix}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared ${keys.length} cache entries for prefix: ${keyPrefix}`);
    }
  } catch (err) {
    logger.error(`Error clearing cache for prefix ${keyPrefix}: ${err.message}`);
  }
};

module.exports = { cache, clearCache };
```