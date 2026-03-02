import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { env } from '../config/env';
import { Logger } from '../config/winston';

const cache = new NodeCache({ stdTTL: env.CACHE_TTL }); // Cache duration from env

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only cache GET requests
  if (req.method !== 'GET') {
    return next();
  }

  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    Logger.debug(`Cache hit for ${key}`);
    return res.send(cachedResponse);
  } else {
    Logger.debug(`Cache miss for ${key}`);
    // Monkey patch res.send to cache the response
    const originalSend = res.send;
    res.send = (body: any) => {
      cache.set(key, body);
      originalSend.call(res, body);
      return res; // Return res to maintain method chainability
    };
    next();
  }
};

export const clearCache = (req: Request, res: Response, next: NextFunction) => {
  Logger.info('Clearing cache...');
  cache.flushAll(); // Clear all cache entries
  next();
};

export default cache; // Export the cache instance for direct manipulation if needed