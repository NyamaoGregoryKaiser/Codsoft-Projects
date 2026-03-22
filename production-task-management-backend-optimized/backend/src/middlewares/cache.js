```javascript
const redisClient = require('../utils/redisClient');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const logger = require('./logger');

const cacheMiddleware = (keyPrefix, ttlSeconds = 3600) => async (req, res, next) => {
  if (req.method !== 'GET') {
    return next(); // Only cache GET requests
  }

  const key = `${keyPrefix}:${req.originalUrl}`; // Unique key for each request
  
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      logger.debug(`Cache HIT for key: ${key}`);
      return res.status(httpStatus.OK).json(JSON.parse(cachedData));
    }
    logger.debug(`Cache MISS for key: ${key}`);
    
    // If no cache, proceed to route handler and then cache the response
    const originalSend = res.send;
    res.send = (body) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        redisClient.setEx(key, ttlSeconds, body); // Cache the response body
        logger.debug(`Cached data for key: ${key} with TTL: ${ttlSeconds}s`);
      }
      originalSend.call(res, body); // Send the response as usual
    };
    next();

  } catch (error) {
    logger.error(`Cache error for key ${key}:`, error);
    next(); // Continue without caching if Redis has an issue
  }
};

const invalidateCache = (keyPrefix) => async (req, res, next) => {
  try {
    // Invalidate all keys starting with the prefix
    const keys = await redisClient.keys(`${keyPrefix}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.debug(`Invalidated cache for prefix: ${keyPrefix} (${keys.length} keys)`);
    }
    next();
  } catch (error) {
    logger.error(`Cache invalidation error for prefix ${keyPrefix}:`, error);
    next(); // Continue even if cache invalidation fails
  }
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
};
```