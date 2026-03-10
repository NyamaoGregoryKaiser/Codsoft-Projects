import { redisClient } from '@config/redis';
import { logger } from '@utils/logger';
import { env } from '@config/env';

export const cacheService = {
  /**
   * Set a key-value pair in Redis cache.
   * @param {string} key - The cache key.
   * @param {any} value - The value to store. Will be JSON stringified.
   * @param {number} [ttlSeconds=env.cacheTtlSeconds] - Time to live in seconds.
   * @returns {Promise<void>}
   */
  set: async <T>(key: string, value: T, ttlSeconds: number = env.cacheTtlSeconds): Promise<void> => {
    if (!redisClient.isOpen) {
      logger.warn('Redis client is not connected, cannot set cache:', key);
      return;
    }
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.setEx(key, ttlSeconds, stringValue);
      logger.debug(`Cache set for key: ${key} with TTL: ${ttlSeconds}s`);
    } catch (error) {
      logger.error(`Error setting cache for key ${key}:`, error);
    }
  },

  /**
   * Get a value from Redis cache.
   * @param {string} key - The cache key.
   * @returns {Promise<T | null>} - The parsed value or null if not found/error.
   */
  get: async <T>(key: string): Promise<T | null> => {
    if (!redisClient.isOpen) {
      logger.warn('Redis client is not connected, cannot get cache:', key);
      return null;
    }
    try {
      const value = await redisClient.get(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
        return JSON.parse(value) as T;
      }
      logger.debug(`Cache miss for key: ${key}`);
      return null;
    } catch (error) {
      logger.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Delete a key from Redis cache.
   * @param {string} key - The cache key.
   * @returns {Promise<void>}
   */
  delete: async (key: string): Promise<void> => {
    if (!redisClient.isOpen) {
      logger.warn('Redis client is not connected, cannot delete cache:', key);
      return;
    }
    try {
      await redisClient.del(key);
      logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
      logger.error(`Error deleting cache for key ${key}:`, error);
    }
  },

  /**
   * Clear all keys matching a pattern. Use with caution in production.
   * @param {string} pattern - The pattern to match keys (e.g., 'product:*').
   * @returns {Promise<void>}
   */
  deleteByPattern: async (pattern: string): Promise<void> => {
    if (!redisClient.isOpen) {
      logger.warn('Redis client is not connected, cannot delete cache by pattern:', pattern);
      return;
    }
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.debug(`Cache deleted for pattern: ${pattern}. Keys removed: ${keys.length}`);
      }
    } catch (error) {
      logger.error(`Error deleting cache by pattern ${pattern}:`, error);
    }
  },
};