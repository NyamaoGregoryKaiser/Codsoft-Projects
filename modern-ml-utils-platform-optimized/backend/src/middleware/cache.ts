import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import config from '../config';
import logger from '../config/logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
});

redisClient.on('connect', () => logger.info('Redis connected successfully!'));
redisClient.on('error', (err) => logger.error('Redis connection error:', err));

const DEFAULT_EXPIRATION = 3600; // 1 hour

export const cache = (duration: number = DEFAULT_EXPIRATION) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      logger.debug('Non-GET request, skipping cache.');
      return next();
    }

    const key = req.originalUrl;
    try {
      const cachedBody = await redisClient.get(key);
      if (cachedBody) {
        logger.debug(`Cache hit for ${key}`);
        res.setHeader('X-Cache-Status', 'HIT');
        return res.send(JSON.parse(cachedBody));
      } else {
        logger.debug(`Cache miss for ${key}`);
        res.setHeader('X-Cache-Status', 'MISS');
        const originalSend = res.send;
        res.send = (body: any) => {
          redisClient.setex(key, duration, JSON.stringify(body)).catch((err) => {
            logger.error(`Error caching response for ${key}:`, err);
          });
          return originalSend.call(res, body);
        };
        next();
      }
    } catch (err) {
      logger.error('Redis cache error:', err);
      next(); // Continue without caching if Redis has issues
    }
  };
};

export const clearCache = async (keyPrefix?: string) => {
  try {
    if (keyPrefix) {
      const keys = await redisClient.keys(`${keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cleared cache for keys matching prefix: ${keyPrefix}`);
      }
    } else {
      await redisClient.flushdb();
      logger.info('Cleared entire Redis cache.');
    }
  } catch (error) {
    logger.error('Error clearing cache:', error);
  }
};

export default redisClient;