import { Request, Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import config from '../config';
import logger from '../config/logger';

const cache = new NodeCache({ stdTTL: config.cache.ttl }); // TTL in seconds

export const cacheMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    logger.debug(`Cache hit for ${key}`);
    return res.status(200).send(cachedResponse);
  }

  // If no cache, override res.send to cache the response
  const originalSend = res.send;
  res.send = (body?: any) => {
    if (res.statusCode === 200) { // Only cache successful responses
      cache.set(key, body);
      logger.debug(`Cached response for ${key}`);
    }
    originalSend.call(res, body);
    return res;
  };

  next();
};

export const clearCache = (key: string) => {
  cache.del(key);
  logger.info(`Cache cleared for key: ${key}`);
};

export const clearAllCache = () => {
  cache.flushAll();
  logger.info('All cache cleared.');
}