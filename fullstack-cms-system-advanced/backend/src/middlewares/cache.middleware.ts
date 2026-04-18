import { Request, Response, NextFunction } from 'express';
import { getCache, setCache } from '../config/redis';
import logger from '../config/logger';

export const cacheMiddleware = (cacheKeyPrefix: string, ttlSeconds?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const key = `${cacheKeyPrefix}:${req.originalUrl}`;
    try {
      const cachedData = await getCache(key);
      if (cachedData) {
        logger.debug(`Cache hit for key: ${key}`);
        return res.status(200).json(cachedData);
      }
      logger.debug(`Cache miss for key: ${key}`);
      // If no cache, proceed to route handler and then cache the response
      const originalSend = res.send;
      res.send = (body: any) => {
        setCache(key, JSON.parse(body), ttlSeconds); // Assuming body is JSON stringified
        originalSend.call(res, body);
        return res;
      };
      next();
    } catch (error) {
      logger.error(`Error in cache middleware for key ${key}:`, error);
      next(); // Continue to the route handler even if cache fails
    }
  };
};

export const clearCacheMiddleware = (cacheKeyPrefix: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // A more robust implementation would delete specific keys or use a pattern,
    // but for simplicity here, we'll just log that cache clear is intended.
    // In a real scenario, you'd invalidate relevant cache entries.
    logger.info(`Cache clear requested for prefix: ${cacheKeyPrefix}. Invalidation logic needs to be implemented.`);
    // For demonstration, we'll just continue.
    // Real implementation would involve deleting cache entries after a data modification.
    next();
  };
};