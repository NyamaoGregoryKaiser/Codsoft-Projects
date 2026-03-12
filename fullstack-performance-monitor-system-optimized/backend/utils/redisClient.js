```javascript
const redis = require('redis');
const logger = require('./logger');

let redisClient;

const initRedisClient = async () => {
  if (!process.env.REDIS_URL) {
    logger.warn('REDIS_URL is not set. Redis client will not be initialized.');
    return null;
  }

  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
    socket: {
      reconnectStrategy: retries => {
        // Implement a custom reconnect strategy
        if (retries > 20) {
          logger.error('Too many Redis reconnect attempts. Giving up.');
          return new Error('Too many reconnects');
        }
        return Math.min(retries * 50, 5000); // Exponential backoff up to 5 seconds
      }
    }
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected to server.');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client is ready to use.');
  });

  redisClient.on('end', () => {
    logger.warn('Redis client connection ended.');
  });

  redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
  });

  try {
    await redisClient.connect();
    return redisClient;
  } catch (err) {
    logger.error('Failed to connect to Redis:', err);
    return null;
  }
};

// Export functions to interact with Redis, ensuring client is initialized
const get = async (key) => {
  if (!redisClient || !redisClient.isReady) {
    logger.debug('Redis client not ready, skipping get operation.');
    return null;
  }
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Error getting from Redis for key ${key}:`, error);
    return null;
  }
};

const set = async (key, value, options = {}) => {
  if (!redisClient || !redisClient.isReady) {
    logger.debug('Redis client not ready, skipping set operation.');
    return;
  }
  try {
    let args = [key, JSON.stringify(value)];
    if (options.EX) { // Expires in seconds
      args.push('EX', options.EX);
    }
    if (options.PX) { // Expires in milliseconds
      args.push('PX', options.PX);
    }
    await redisClient.set(args);
  } catch (error) {
    logger.error(`Error setting in Redis for key ${key}:`, error);
  }
};

const del = async (key) => {
  if (!redisClient || !redisClient.isReady) {
    logger.debug('Redis client not ready, skipping del operation.');
    return;
  }
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Error deleting from Redis for key ${key}:`, error);
  }
};

module.exports = {
  connect: initRedisClient,
  get,
  set,
  del,
  // Expose the client instance for direct use if necessary, though prefer wrappers
  get client() {
    return redisClient;
  }
};
```