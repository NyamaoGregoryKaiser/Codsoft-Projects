import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import config from '../config/env';
import logger from '../config/logger';
import { RedisCacheConfig } from '../types';

const redisClient = createClient({
  url: config.REDIS_URL,
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('connect', () => logger.info('Connected to Redis...'));

async function connectRedis() {
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
}
connectRedis(); // Connect on startup

const cache = ({ key, ttl = config.CACHE_TTL_SECONDS }: RedisCacheConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (config.NODE_ENV === 'test') { // Disable cache in test environment
      return next();
    }

    await connectRedis();

    const cacheKey = key || req.originalUrl;

    try {
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.debug(`Cache miss for ${cacheKey}`);
      // If not cached, continue to route handler, then cache the response
      const originalSend = res.send;
      res.send = (body) => {
        redisClient.set(cacheKey, body, { EX: ttl })
          .then(() => logger.debug(`Cached ${cacheKey} with TTL ${ttl}s`))
          .catch((err) => logger.error(`Failed to set cache for ${cacheKey}: ${err.message}`));
        originalSend.call(res, body);
        return res; // Must return res to match originalSend behavior
      };
      next();
    } catch (err: any) {
      logger.error(`Redis cache error: ${err.message}`);
      next(); // Continue without caching on error
    }
  };
};

export default cache;
export { redisClient };