```javascript
const redis = require('redis');
const config = require('../config');
const logger = require('./logger');

let client;

/**
 * Initializes the Redis client connection.
 * @returns {Promise<void>}
 */
const initRedis = async () => {
  if (client && client.isOpen) {
    logger.warn('Redis client already initialized and open.');
    return;
  }
  try {
    client = redis.createClient({
      url: config.redisUrl,
    });

    client.on('error', (err) => logger.error('Redis Client Error', err));
    client.on('connect', () => logger.info('Redis client connected.'));
    client.on('ready', () => logger.info('Redis client ready to use.'));
    client.on('end', () => logger.info('Redis client connection ended.'));

    await client.connect();
  } catch (err) {
    logger.error('Could not connect to Redis:', err);
    throw err; // Re-throw to indicate server startup failure
  }
};

/**
 * Gets a value from Redis cache.
 * @param {string} key - The cache key.
 * @returns {Promise<string|null>} The cached value or null.
 */
const get = async (key) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client is not connected. Skipping cache get.');
    return null;
  }
  try {
    return await client.get(key);
  } catch (err) {
    logger.error(`Error getting key ${key} from Redis:`, err);
    return null;
  }
};

/**
 * Sets a value in Redis cache with an optional expiration.
 * @param {string} key - The cache key.
 * @param {string} value - The value to cache.
 * @param {number} [expirationInSeconds] - Optional expiration time in seconds.
 * @returns {Promise<void>}
 */
const set = async (key, value, expirationInSeconds) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client is not connected. Skipping cache set.');
    return;
  }
  try {
    if (expirationInSeconds) {
      await client.setEx(key, expirationInSeconds, value);
    } else {
      await client.set(key, value);
    }
  } catch (err) {
    logger.error(`Error setting key ${key} in Redis:`, err);
  }
};

/**
 * Deletes a value from Redis cache.
 * @param {string} key - The cache key to delete.
 * @returns {Promise<void>}
 */
const del = async (key) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client is not connected. Skipping cache delete.');
    return;
  }
  try {
    await client.del(key);
  } catch (err) {
    logger.error(`Error deleting key ${key} from Redis:`, err);
  }
};

/**
 * Deletes all keys matching a pattern. Use with caution!
 * @param {string} pattern - The pattern to match (e.g., 'user:*').
 * @returns {Promise<void>}
 */
const delPattern = async (pattern) => {
  if (!client || !client.isOpen) {
    logger.warn('Redis client is not connected. Skipping cache delete by pattern.');
    return;
  }
  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
      logger.info(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
  } catch (err) {
    logger.error(`Error deleting keys by pattern ${pattern} from Redis:`, err);
  }
};


/**
 * Generates a consistent cache key from multiple arguments.
 * @param {...any} args - Arguments to form the key.
 * @returns {string} The generated cache key.
 */
const generateKey = (...args) => {
  return args.join(':');
};

module.exports = {
  initRedis,
  get,
  set,
  del,
  delPattern,
  generateKey,
  getClient: () => client, // For testing or direct access if needed
};
```