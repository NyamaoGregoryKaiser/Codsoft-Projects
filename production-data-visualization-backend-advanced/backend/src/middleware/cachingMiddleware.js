const NodeCache = require('node-cache');
const config = require('../config/config');
const logger = require('../utils/logger');

// Initialize NodeCache with a default TTL from config
const apiCache = new NodeCache({ stdTTL: config.cacheTTL });

exports.cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;
  const cachedResponse = apiCache.get(key);

  if (cachedResponse) {
    logger.debug(`Cache HIT for ${key}`);
    return res.status(200).json(cachedResponse);
  }

  logger.debug(`Cache MISS for ${key}`);
  // Monkey patch res.json to cache the response
  const originalJson = res.json;
  res.json = (body) => {
    apiCache.set(key, body);
    originalJson.call(res, body);
  };
  next();
};

exports.clearCache = (req, res, next) => {
  // Optionally clear cache for specific routes or when data changes
  // For example, when a resource is created, updated, or deleted
  apiCache.flushAll(); // Or apiCache.del(key) for specific invalidation
  logger.info('API Cache flushed.');
  next();
};