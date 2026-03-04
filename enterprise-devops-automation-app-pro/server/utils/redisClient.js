const redis = require('redis');
const logger = require('./logger');

const redisClient = redis.createClient({
  url: `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('ready', () => logger.info('Redis client ready to use'));
redisClient.on('error', (err) => logger.error(`Redis client error: ${err.message}`));
redisClient.on('end', () => logger.warn('Redis client disconnected'));

// Connect to Redis when the module is required
(async () => {
  if (!redisClient.isReady) {
    try {
      await redisClient.connect();
    } catch (err) {
      logger.error(`Could not connect to Redis: ${err.message}`);
    }
  }
})();

module.exports = redisClient;