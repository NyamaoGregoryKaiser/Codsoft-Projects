import { Request, Response, NextFunction } from 'express';
import { redisClient } from '@config/redis';
import logger from '@config/logger';

/**
 * Cache middleware to store and retrieve API responses from Redis.
 * Only caches GET requests.
 * @param durationSeconds - The duration in seconds to cache the response.
 * @returns Express middleware function.
 */
export const cacheMiddleware = (durationSeconds: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache GET requests and only if Redis is ready
    if (req.method !== 'GET' || !redisClient.isReady) {
      return next();
    }

    const key = req.originalUrl; // Use the full URL as the cache key

    try {
      const cachedBody = await redisClient.get(key);

      if (cachedBody) {
        logger.debug(`Cache HIT for key: ${key}`);
        return res.status(200).json(JSON.parse(cachedBody));
      } else {
        logger.debug(`Cache MISS for key: ${key}`);
        // If not in cache, capture the response
        const originalSend = res.send;
        res.send = (body: any) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            // Only cache successful responses
            redisClient.setEx(key, durationSeconds, body).catch(cacheErr => {
              logger.error(`Failed to set cache for key ${key}:`, cacheErr);
            });
          }
          originalSend.apply(res, [body]);
          return res;
        };
        next();
      }
    } catch (error) {
      logger.error(`Error in cache middleware for key ${key}:`, error);
      next(); // Continue to next middleware/route handler in case of cache error
    }
  };
};