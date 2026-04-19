```typescript
import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { config } from '../config/config';
import { logger } from '../utils/logger';

const cache = new NodeCache({ stdTTL: config.CACHE_TTL, checkperiod: 120 });

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (config.ENABLE_CACHE === false || req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    logger.debug(`Cache HIT for ${key}`);
    return res.status(200).json(cachedResponse);
  }

  logger.debug(`Cache MISS for ${key}`);
  const originalSend = res.json;
  res.json = (body: any) => {
    cache.set(key, body);
    logger.debug(`Cached response for ${key}`);
    return originalSend.call(res, body);
  };
  next();
};

export const clearCache = (key?: string) => {
  if (key) {
    cache.del(key);
    logger.info(`Cache cleared for key: ${key}`);
  } else {
    cache.flushAll();
    logger.info('All cache cleared');
  }
};
```