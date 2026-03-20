const NodeCache = require('node-cache');
const config = require('@config');
const logger = require('@utils/logger');

// Initialize cache with a standard TTL from config
const appCache = new NodeCache({ stdTTL: config.cacheTTL, checkperiod: config.cacheTTL * 0.2, useClones: false });

appCache.on("set", function (key, value) {
  logger.debug(`Cache set for key: ${key}`);
});

appCache.on("del", function (key, value) {
  logger.debug(`Cache deleted for key: ${key}`);
});

appCache.on("expired", function (key, value) {
  logger.debug(`Cache expired for key: ${key}`);
});

/**
 * Retrieves data from cache or fetches it if not present.
 * @param {string} key - The cache key.
 * @param {function} fetcher - An async function to fetch data if not in cache.
 * @param {number} [ttl] - Optional TTL for this specific item (defaults to global config).
 * @returns {Promise<any>} The cached or fetched data.
 */
const getOrSetCache = async (key, fetcher, ttl = config.cacheTTL) => {
  const cachedData = appCache.get(key);
  if (cachedData) {
    logger.debug(`Cache hit for key: ${key}`);
    return cachedData;
  }

  logger.debug(`Cache miss for key: ${key}, fetching data...`);
  const data = await fetcher();
  if (data) {
    appCache.set(key, data, ttl);
  }
  return data;
};

/**
 * Deletes an item from the cache.
 * @param {string} key - The cache key to delete.
 * @returns {boolean} True if the key existed and was deleted, false otherwise.
 */
const delCache = (key) => {
  return appCache.del(key);
};

/**
 * Flushes the entire cache.
 */
const flushCache = () => {
  appCache.flushAll();
  logger.info('Cache flushed.');
};

module.exports = {
  getOrSetCache,
  delCache,
  flushCache,
  appCache, // Expose for specific operations if needed
};