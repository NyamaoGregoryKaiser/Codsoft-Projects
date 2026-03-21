const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redisClient;

try {
  redisClient = new Redis(config.REDIS_URL);
  redisClient.on('connect', () => logger.info('Redis client connected.'));
  redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
} catch (error) {
  logger.error('Failed to initialize Redis:', error);
}


const cache = (keyPrefix, ttlSeconds = 3600) => async (req, res, next) => {
  if (!redisClient) {
    logger.warn('Redis client not initialized, skipping cache middleware.');
    return next();
  }

  const key = `${keyPrefix}:${req.originalUrl}`;

  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      logger.debug(`Cache hit for key: ${key}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    logger.debug(`Cache miss for key: ${key}`);
    // Store original res.json to intercept response
    const originalJson = res.json;
    res.json = (data) => {
      // Only cache successful GET responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.method === 'GET') {
        redisClient.setex(key, ttlSeconds, JSON.stringify(data));
      }
      return originalJson.call(res, data);
    };
    next();
  } catch (error) {
    logger.error('Error with Redis cache:', error);
    next(); // Continue without caching if Redis fails
  }
};

const clearCache = (keyPattern) => async (req, res, next) => {
  if (!redisClient) {
    logger.warn('Redis client not initialized, skipping cache clear.');
    return next();
  }
  try {
    const keys = await redisClient.keys(`${keyPattern}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared cache keys matching pattern: ${keyPattern}:*`);
    } else {
      logger.debug(`No cache keys found for pattern: ${keyPattern}:*`);
    }
    next();
  } catch (error) {
    logger.error('Error clearing Redis cache:', error);
    next();
  }
};

module.exports = { cache, clearCache };