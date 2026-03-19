import { caching, CacheStore } from 'cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { REDIS_HOST, REDIS_PORT } from './env';
import { logger } from './logger';

let redisCache: CacheStore;

const configureCache = async () => {
  try {
    redisCache = await redisStore({
      socket: {
        host: REDIS_HOST,
        port: REDIS_PORT,
      },
      ttl: 60 * 60 * 1000, // 1 hour in ms by default
    });

    // Check if Redis is connected
    await redisCache.get('test_key');
    logger.info(`Redis cache connected to ${REDIS_HOST}:${REDIS_PORT}`);

    return caching({
      store: redisCache,
      ttl: 60 * 60 * 1000, // 1 hour
    });
  } catch (error) {
    logger.error('Failed to connect to Redis cache. Running without cache.', error);
    // Fallback to in-memory cache if Redis fails
    return caching({
      store: 'memory',
      ttl: 10 * 1000, // 10 seconds for memory cache
    });
  }
};

export const cache = configureCache();