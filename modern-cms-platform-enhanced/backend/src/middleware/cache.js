```javascript
const config = require('../config/config');
const logger = require('../utils/logger');

// Simple in-memory cache for demonstration purposes
const cache = new Map();

const getCacheKey = (req) => req.originalUrl;

const cacheMiddleware = (req, res, next) => {
  if (req.method !== 'GET') {
    return next();
  }

  const key = getCacheKey(req);
  const cachedData = cache.get(key);

  if (cachedData && Date.now() < cachedData.expires) {
    logger.debug(`Cache hit for ${key}`);
    return res.status(200).json(cachedData.data);
  }

  logger.debug(`Cache miss for ${key}`);
  const originalSend = res.json;
  res.json = (body) => {
    cache.set(key, {
      data: body,
      expires: Date.now() + config.cache.ttlSeconds * 1000,
    });
    logger.debug(`Caching response for ${key}`);
    originalSend.call(res, body);
  };

  next();
};

const clearCache = (req, res, next) => {
  cache.clear();
  logger.info('Cache cleared globally.');
  next();
};

const clearCacheForPath = (pathPrefix) => (req, res, next) => {
  let clearedCount = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) {
      cache.delete(key);
      clearedCount++;
    }
  }
  logger.info(`Cleared ${clearedCount} cache entries for path prefix: ${pathPrefix}`);
  next();
};

module.exports = {
  cacheMiddleware,
  clearCache,
  clearCacheForPath,
};
```