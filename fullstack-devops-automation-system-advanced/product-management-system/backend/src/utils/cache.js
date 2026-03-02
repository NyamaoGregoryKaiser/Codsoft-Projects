const { caching } = require('node-cache-manager');
const redisStore = require('node-cache-manager-redis-store');
const config = require('../config');
const logger = require('./logger');

let cacheManager;

if (config.redis.host && config.redis.port) {
  cacheManager = caching({
    store: redisStore,
    host: config.redis.host,
    port: config.redis.port,
    auth_pass: config.redis.password, // if your redis requires password
    ttl: config.redis.cacheTTLSeconds, // Default cache TTL
    // Other Redis options:
    // enableOfflineQueue: false, // If false, no operations are queued up if Redis is offline.
    // retry_strategy: options => {
    //   if (options.error && options.error.code === 'ECONNREFUSED') {
    //     // End reconnecting on a specific error and flush all commands with a individual error
    //     return new Error('The server refused the connection');
    //   }
    //   if (options.total_retry_time > 1000 * 60 * 60) {
    //     // End reconnecting after 1 hour
    //     return new Error('Retry time exhausted');
    //   }
    //   if (options.attempt > 10) {
    //     // End reconnecting with a maximum of 10 retries
    //     return undefined;
    //   }
    //   // reconnect after 500ms
    //   return Math.min(options.attempt * 100, 3000);
    // },
  });

  // Log Redis connection status
  cacheManager.store.getClient().on('connect', () => logger.info('Redis client connected to cache.'));
  cacheManager.store.getClient().on('error', (err) => logger.error('Redis client error:', err));
} else {
  // Fallback to in-memory cache if Redis is not configured or fails
  logger.warn('Redis configuration missing or failed, falling back to in-memory cache.');
  cacheManager = caching({
    store: 'memory',
    ttl: config.redis.cacheTTLSeconds,
  });
}

/**
 * Get data from cache, or execute a function and set the cache.
 * @param {string} key - The cache key.
 * @param {Function} cb - The callback function to execute if cache miss.
 * @param {number} [ttl] - Optional TTL for this specific cache entry in seconds.
 * @returns {Promise<any>} - Cached data or result of the callback.
 */
const getOrSetCache = async (key, cb, ttl = config.redis.cacheTTLSeconds) => {
  try {
    const data = await cacheManager.get(key);
    if (data) {
      logger.debug(`Cache hit for key: ${key}`);
      return data;
    }
    logger.debug(`Cache miss for key: ${key}, executing callback.`);
    const result = await cb();
    await cacheManager.set(key, result, ttl);
    return result;
  } catch (error) {
    logger.error(`Cache operation failed for key ${key}:`, error);
    // In case of cache failure, return data directly from the callback
    return cb();
  }
};

/**
 * Invalidate (delete) a cache entry.
 * @param {string} key - The cache key to invalidate.
 */
const invalidateCache = async (key) => {
  try {
    await cacheManager.del(key);
    logger.debug(`Cache invalidated for key: ${key}`);
  } catch (error) {
    logger.error(`Cache invalidation failed for key ${key}:`, error);
  }
};

module.exports = {
  getOrSetCache,
  invalidateCache
};
```

```