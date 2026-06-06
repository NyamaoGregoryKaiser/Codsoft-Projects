```javascript
const httpStatus = require('http-status');
const redisClient = require('../utils/redis');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

/**
 * Caching middleware for GET requests.
 * Caches responses in Redis.
 * @param {string} keyPrefix - Prefix for the Redis key (e.g., 'projects', 'users')
 * @param {number} ttlSeconds - Time-to-live for the cache entry in seconds
 */
const cache = (keyPrefix, ttlSeconds = 3600) => async (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  // Construct a unique cache key based on URL and query parameters
  const cacheKey = `${keyPrefix}:${req.originalUrl}`;

  try {
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      logger.debug(`Cache HIT for key: ${cacheKey}`);
      return res.status(httpStatus.OK).json(JSON.parse(cachedData));
    }

    logger.debug(`Cache MISS for key: ${cacheKey}`);

    // If no cache, proceed to route handler and then cache the response
    const originalJson = res.json;
    res.json = (body) => {
      redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body))
        .catch((error) => logger.error(`Error setting cache for ${cacheKey}: ${error.message}`));
      originalJson.call(res, body);
    };

    next();
  } catch (error) {
    logger.error(`Cache middleware error for key ${cacheKey}: ${error.message}`);
    // If Redis is down or caching fails, simply bypass cache and proceed
    next();
  }
};

/**
 * Invalidate cache for a specific key or pattern.
 * Use after POST, PUT, PATCH, DELETE operations that modify data.
 * @param {string | string[]} keyOrPattern - A single key, an array of keys, or a glob pattern (e.g., 'projects:*')
 */
const invalidateCache = (keyOrPattern) => async (req, res, next) => {
  try {
    if (Array.isArray(keyOrPattern)) {
      await Promise.all(keyOrPattern.map(key => redisClient.del(key)));
      logger.info(`Invalidated multiple cache keys: ${keyOrPattern.join(', ')}`);
    } else {
      // For glob patterns, use KEYS command (careful in production) or scan
      // For simplicity, we'll assume direct key or `key:*` for `del`
      if (keyOrPattern.endsWith('*')) {
        // Warning: `KEYS` command can block Redis for large datasets.
        // For production, consider using `SCAN` in a loop.
        const keys = await redisClient.keys(keyOrPattern);
        if (keys.length > 0) {
          await redisClient.del(keys);
          logger.info(`Invalidated cache pattern "${keyOrPattern}", deleted ${keys.length} keys.`);
        } else {
          logger.info(`No keys found for cache pattern "${keyOrPattern}".`);
        }
      } else {
        await redisClient.del(keyOrPattern);
        logger.info(`Invalidated cache key: ${keyOrPattern}`);
      }
    }
  } catch (error) {
    logger.error(`Error invalidating cache for ${keyOrPattern}: ${error.message}`);
    // Do not block the request if cache invalidation fails
  }
  next();
};

module.exports = {
  cache,
  invalidateCache,
};
```