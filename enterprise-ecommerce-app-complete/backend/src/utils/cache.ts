```typescript
import { createClient } from 'ioredis';
import { config } from '../config';
import logger from './logger';

export const redisClient = createClient(config.REDIS_URL);

redisClient.on('connect', () => logger.info('Redis client connected.'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));

export const connectRedis = async () => {
  try {
    await redisClient.ping();
  } catch (err) {
    logger.error('Could not connect to Redis. Please ensure Redis server is running.', err);
    throw err; // Re-throw to prevent server from starting without Redis
  }
};

/**
 * Sets data in Redis cache with an expiration time.
 * @param key The cache key.
 * @param data The data to store.
 * @param ttl The time to live in seconds (default: 3600 seconds = 1 hour).
 */
export const setCache = async (key: string, data: any, ttl: number = 3600): Promise<void> => {
  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
    logger.debug(`Cache set for key: ${key}`);
  } catch (error) {
    logger.error(`Error setting cache for key ${key}:`, error);
  }
};

/**
 * Retrieves data from Redis cache.
 * @param key The cache key.
 * @returns The cached data parsed as JSON, or null if not found.
 */
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    if (data) {
      logger.debug(`Cache hit for key: ${key}`);
      return JSON.parse(data) as T;
    }
    logger.debug(`Cache miss for key: ${key}`);
    return null;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Deletes data from Redis cache.
 * @param key The cache key.
 */
export const deleteCache = async (key: string | string[]): Promise<void> => {
  try {
    const keysToDelete = Array.isArray(key) ? key : [key];
    await redisClient.del(...keysToDelete);
    logger.debug(`Cache deleted for key(s): ${keysToDelete.join(', ')}`);
  } catch (error) {
    logger.error(`Error deleting cache for key(s) ${key}:`, error);
  }
};

/**
 * Clears all cache entries matching a pattern. Use with caution!
 * @param pattern The pattern to match (e.g., 'products:*').
 */
export const clearCacheByPattern = async (pattern: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      logger.debug(`Cleared ${keys.length} cache entries matching pattern: ${pattern}`);
    } else {
      logger.debug(`No cache entries found for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error(`Error clearing cache by pattern ${pattern}:`, error);
  }
};
```