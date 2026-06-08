const { redisClient } = require('../config/redis');
const logger = require('../config/logger');

const CACHE_EXPIRATION_SECONDS = 3600; // 1 hour

const cacheMiddleware = (req, res, next) => {
  const key = req.originalUrl;

  redisClient.get(key)
    .then((data) => {
      if (data) {
        logger.debug(`Cache hit for ${key}`);
        return res.send(JSON.parse(data));
      } else {
        logger.debug(`Cache miss for ${key}`);
        res.sendResponse = res.send;
        res.send = (body) => {
          redisClient.setEx(key, CACHE_EXPIRATION_SECONDS, JSON.stringify(body))
            .catch(err => logger.error('Error setting cache:', err));
          res.sendResponse(body);
        };
        next();
      }
    })
    .catch((err) => {
      logger.error('Redis cache error:', err);
      next(); // Continue to next middleware if cache fails
    });
};

const clearCache = (req, res, next) => {
    // Implement cache clearing logic based on patterns, e.g., `/api/posts*`
    // For simplicity, this is a placeholder. You'd likely clear specific keys
    // or use a more sophisticated invalidation strategy.
    // Example: redisClient.del('api/posts'); or redisClient.del('api/posts/slug');
    next();
};

module.exports = {
  cacheMiddleware,
  clearCache
};