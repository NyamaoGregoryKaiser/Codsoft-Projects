```typescript
import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';
import ApiResponse from '../utils/apiResponse';

const DEFAULT_EXPIRATION = 3600; // 1 hour

interface CacheOptions {
  expiration?: number; // Cache expiration in seconds
  // Add more options if needed, e.g., 'keyPrefix'
}

export const cache = (options: CacheOptions = {}) => {
  const expiration = options.expiration || DEFAULT_EXPIRATION;

  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') {
      return next(); // Only cache GET requests
    }

    // Generate a unique cache key based on the request URL and user (if authenticated)
    // This ensures different users or different query parameters get different cache entries
    const userIdentifier = req.user ? `user:${req.user.id}:` : '';
    const cacheKey = `cache:${userIdentifier}${req.originalUrl}`;
    req.cacheKey = cacheKey; // Attach cache key to request for potential cache invalidation later

    try {
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return res.json(JSON.parse(cachedData));
      }

      logger.debug(`Cache miss for key: ${cacheKey}`);
      // If not in cache, proceed to the route handler and cache the response
      const originalSend = res.json; // Capture the original json method

      res.json = (body: any) => {
        redisClient.setex(cacheKey, expiration, JSON.stringify(body))
          .catch(err => logger.error(`Error caching response for ${cacheKey}:`, err));
        return originalSend.call(res, body);
      };
      next();
    } catch (err) {
      logger.error(`Redis cache error for key ${cacheKey}:`, err);
      next(); // Continue without caching if Redis is down or has issues
    }
  };
};

export const clearCache = async (key: string | string[]) => {
  if (!redisClient.isReady) {
    logger.warn('Redis client not ready. Cannot clear cache.');
    return;
  }
  try {
    if (Array.isArray(key)) {
      for (const k of key) {
        const pattern = `cache:${k}*`; // Invalidate all keys starting with `k`
        const keysToDelete = await redisClient.keys(pattern);
        if (keysToDelete.length > 0) {
          await redisClient.del(keysToDelete);
          logger.info(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
        } else {
          logger.info(`No cache entries found for pattern: ${pattern}`);
        }
      }
    } else {
      const pattern = `cache:${key}*`; // Invalidate all keys starting with `key`
      const keysToDelete = await redisClient.keys(pattern);
      if (keysToDelete.length > 0) {
        await redisClient.del(keysToDelete);
        logger.info(`Cleared ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
      } else {
        logger.info(`No cache entries found for pattern: ${pattern}`);
      }
    }
  } catch (err) {
    logger.error('Error clearing cache:', err);
  }
};

// Invalidate cache for relevant keys after a mutation (POST, PUT, DELETE)
export const invalidateCache = (keysToInvalidate: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await clearCache(keysToInvalidate);
    next();
  };
};
```