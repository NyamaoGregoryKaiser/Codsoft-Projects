```javascript
const NodeCache = require('node-cache');
const config = require('../config/config');
const logger = require('./logger');

// Initialize NodeCache with a standard TTL
const cache = new NodeCache({ stdTTL: config.cache.ttlSeconds, checkperiod: config.cache.ttlSeconds * 0.2, useClones: false });

cache.on('set', (key, value) => {
  logger.debug(`Cache set for key: ${key}`);
});

cache.on('del', (key) => {
  logger.debug(`Cache deleted for key: ${key}`);
});

cache.on('expired', (key, value) => {
  logger.debug(`Cache expired for key: ${key}`);
});

const getOrSetCache = async (key, callback, ttlSeconds = config.cache.ttlSeconds) => {
  const value = cache.get(key);
  if (value) {
    logger.debug(`Cache hit for key: ${key}`);
    return value;
  }

  logger.debug(`Cache miss for key: ${key}, fetching from source...`);
  const result = await callback();
  if (result) {
    cache.set(key, result, ttlSeconds);
  }
  return result;
};

// Expose cache instance for manual invalidation (e.g., after DB writes)
module.exports = {
  getOrSetCache,
  cache,
};

// Attach cache to Sequelize instance for convenience (optional)
const db = require('../db'); // Require db here to avoid circular dependency issues
if (db.sequelize) {
  db.sequelize.cacheManager = cache;
}
```