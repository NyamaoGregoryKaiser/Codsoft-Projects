```typescript
import { Request, Response, NextFunction } from 'express';
import { Cache } from '../utils/cache';
import logger from '../utils/logger';

// Initialize cache for specific resource types
export const dataSourceCache = new Cache('dataSources', 300); // 5 minutes cache
export const visualizationCache = new Cache('visualizations', 300); // 5 minutes cache
export const dashboardCache = new Cache('dashboards', 300); // 5 minutes cache

// Generic caching middleware
export const cachingMiddleware = (cache: Cache) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate a cache key based on URL and user ID
    // User ID is crucial for personalized data caching
    const userId = req.user?.id;
    if (!userId) {
      logger.warn(`Caching: No user ID found for request to ${req.originalUrl}. Skipping cache.`);
      return next(); // Skip cache if user is not authenticated or user ID missing
    }
    const cacheKey = `${cache.name}:${userId}:${req.originalUrl}`;

    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      logger.debug(`Caching: Cache hit for key: ${cacheKey}`);
      return res.status(200).json(cachedResponse);
    }

    // If not in cache, proceed to route handler and then cache the response
    const originalJson = res.json;
    res.json = (body: any) => {
      logger.debug(`Caching: Storing response for key: ${cacheKey}`);
      cache.set(cacheKey, body);
      return originalJson.call(res, body);
    };

    next();
  };
};
```