const { createClient } = require('redis');
const config = require('./config');
const logger = require('./logger');

const redisClient = createClient({
  url: `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}`,
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis client error:', err));

const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (err) {
    logger.error('Could not connect to Redis', err);
    process.exit(1); // Exit process if Redis connection fails
  }
};

module.exports = {
  redisClient,
  connectRedis
};