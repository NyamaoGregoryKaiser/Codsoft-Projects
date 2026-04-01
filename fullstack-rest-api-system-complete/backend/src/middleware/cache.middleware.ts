import { Request, Response, NextFunction } from 'express';
import redisClient from '../config/redis';
import logger from '../utils/logger';

const DEFAULT_EXPIRATION = 3600; // 1 hour in seconds

export const cacheMiddleware = (duration = DEFAULT_EXPIRATION) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      logger.debug(`Skipping cache for non-GET request: ${req.method} ${req.originalUrl}`);
      return next();
    }

    const key = req.originalUrl;

    try {
      const cachedBody = await redisClient.get(key);
      if (cachedBody) {
        logger.debug(`Cache HIT for key: ${key}`);
        return res.send(JSON.parse(cachedBody));
      }

      logger.debug(`Cache MISS for key: ${key}`);
      const originalSend = res.send;
      res.send = (body: any) => {
        // Cache the response if status is 200 OK
        if (res.statusCode === 200) {
          redisClient.setex(key, duration, JSON.stringify(body)).catch((err) => {
            logger.error(`Failed to set cache for key ${key}: ${err.message}`);
          });
          logger.debug(`Response cached for key: ${key}`);
        }
        originalSend.call(res, body);
        return res; // Must return res for chaining
      };
      next();
    } catch (error) {
      logger.error(`Redis cache error: ${error.message}`);
      next(); // Continue to route if Redis is down or errors
    }
  };
};

export const clearCache = async (keyPrefix?: string) => {
  try {
    if (keyPrefix) {
      const keys = await redisClient.keys(`${keyPrefix}*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`Cache cleared for prefix: ${keyPrefix}*`);
      }
    } else {
      await redisClient.flushdb();
      logger.info('All cache cleared.');
    }
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
  }
};