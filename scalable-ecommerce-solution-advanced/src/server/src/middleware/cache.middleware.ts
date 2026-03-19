import { Request, Response, NextFunction } from 'express';
import { cache } from '../config/cache';
import { logger } from '../config/logger';

const TTL_ONE_HOUR = 60 * 60; // seconds

export const cacheMiddleware = (keyPrefix: string, ttlSeconds: number = TTL_ONE_HOUR) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheKey = `${keyPrefix}:${req.originalUrl}`;
    const cacheManager = await cache; // Await the promise resolving to the cache instance

    try {
      const cachedResponse = await cacheManager.get(cacheKey);
      if (cachedResponse) {
        logger.debug(`Cache hit for ${cacheKey}`);
        return res.send(cachedResponse);
      }

      logger.debug(`Cache miss for ${cacheKey}`);
      // If not in cache, proxy the response and cache it
      const originalSend = res.send;
      res.send = (body: any) => {
        cacheManager.set(cacheKey, body, { ttl: ttlSeconds }).catch(err => {
          logger.error(`Failed to cache response for ${cacheKey}:`, err);
        });
        return originalSend.call(res, body);
      };
      next();
    } catch (error) {
      logger.error(`Error in cache middleware for ${cacheKey}:`, error);
      next(); // Continue without caching if there's an error
    }
  };
};