import NodeCache from 'node-cache';
import config from '../config';
import logger from '../config/logger';

// Initialize cache with a standard TTL from config
const cache = new NodeCache({ stdTTL: config.cacheTTL });

cache.on('set', (key, value) => {
    logger.debug(`Cache set: ${key}`);
});

cache.on('del', (key) => {
    logger.debug(`Cache deleted: ${key}`);
});

cache.on('expired', (key, value) => {
    logger.debug(`Cache expired: ${key}`);
});

/**
 * Cache utility functions.
 * In a real-world scenario, you might use Redis for distributed caching.
 */
class CacheService {
    /**
     * Get a value from the cache.
     * @param key The cache key.
     * @returns The cached value or undefined.
     */
    get<T>(key: string): T | undefined {
        return cache.get<T>(key);
    }

    /**
     * Set a value in the cache.
     * @param key The cache key.
     * @param value The value to cache.
     * @param ttl Optional time-to-live in seconds.
     * @returns True if set successfully, false otherwise.
     */
    set<T>(key: string, value: T, ttl?: number): boolean {
        return cache.set(key, value, ttl);
    }

    /**
     * Delete a value from the cache.
     * @param key The cache key.
     * @returns The number of deleted keys.
     */
    del(key: string): number {
        return cache.del(key);
    }

    /**
     * Delete all keys that match a pattern.
     * @param pattern Regex pattern to match keys.
     */
    delByPattern(pattern: string): number {
        const keys = cache.keys();
        const keysToDelete = keys.filter(key => key.match(pattern));
        if (keysToDelete.length > 0) {
            logger.debug(`Deleting cache keys matching pattern '${pattern}': ${keysToDelete.join(', ')}`);
            return cache.del(keysToDelete);
        }
        return 0;
    }

    /**
     * Check if a key exists in the cache.
     * @param key The cache key.
     * @returns True if the key exists, false otherwise.
     */
    has(key: string): boolean {
        return cache.has(key);
    }

    /**
     * Clear all cache entries.
     */
    flush(): void {
        cache.flushAll();
        logger.info('Cache flushed.');
    }
}

export default new CacheService();