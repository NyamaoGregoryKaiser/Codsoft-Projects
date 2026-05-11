const NodeCache = require('node-cache');
const config = require('../config/config');
const logger = require('./logger');

// Initialize Node-Cache with a standard TTL from config
const cache = new NodeCache({ stdTTL: config.cacheTTL, checkperiod: config.cacheTTL * 0.2 });

/**
 * Stores data in the cache.
 * @param {string} key - The cache key.
 * @param {*} value - The data to store.
 * @param {number} [ttl] - Optional TTL for this specific entry (in seconds). Defaults to global stdTTL.
 */
const setCache = (key, value, ttl) => {
  const success = cache.set(key, value, ttl);
  if (success) {
    logger.debug(`Cache SET: ${key}`);
  } else {
    logger.error(`Cache SET failed: ${key}`);
  }
};

/**
 * Retrieves data from the cache.
 * @param {string} key - The cache key.
 * @returns {*} The cached data or undefined if not found.
 */
const getCache = (key) => {
  const value = cache.get(key);
  if (value !== undefined) {
    logger.debug(`Cache HIT: ${key}`);
  } else {
    logger.debug(`Cache MISS: ${key}`);
  }
  return value;
};

/**
 * Deletes an entry from the cache.
 * @param {string} key - The cache key.
 */
const deleteCache = (key) => {
  const count = cache.del(key);
  if (count > 0) {
    logger.debug(`Cache DELETED: ${key}`);
  } else {
    logger.warn(`Cache DELETE attempted for non-existent key: ${key}`);
  }
};

/**
 * Flushes the entire cache. Use with caution.
 */
const flushCache = () => {
  cache.flushAll();
  logger.info('Cache FLUSHED');
};

// Event listeners for cache operations
cache.on('set', (key, value) => {
  // logger.debug(`Cache 'set' event for key: ${key}`);
});

cache.on('del', (key, value) => {
  // logger.debug(`Cache 'del' event for key: ${key}`);
});

cache.on('expired', (key, value) => {
  logger.debug(`Cache 'expired' event for key: ${key}`);
});

module.exports = {
  setCache,
  getCache,
  deleteCache,
  flushCache,
};
```