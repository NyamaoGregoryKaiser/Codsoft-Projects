import { createClient } from 'redis';
import { REDIS_HOST, REDIS_PORT, NODE_ENV } from './env';
import logger from './logger';

const REDIS_URL = `redis://${REDIS_HOST}:${REDIS_PORT}`;

/**
 * Redis client instance for caching and rate limiting.
 */
export const redisClient = createClient({
  url: REDIS_URL,
});

// Connect to Redis only if not in test environment
if (NODE_ENV !== 'test') {
  redisClient.on('connect', () => {
    logger.info(`Connected to Redis at ${REDIS_URL}`);
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error', err);
  });

  (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      logger.error('Failed to connect to Redis:', err);
    }
  })();
} else {
  logger.warn('Redis client not connected in TEST environment.');
}

export const getRedisClient = () => redisClient;