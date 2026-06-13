const { createClient } = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

let client;

const connectRedis = async () => {
  try {
    client = createClient({
      url: `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}`,
    });

    client.on('error', (err) => {
      logger.error('Redis Client Error', err);
      // Process.exit(1) might be too aggressive for just a cache
    });

    // client.on('connect', () => logger.info('Redis client connected'));
    // client.on('ready', () => logger.info('Redis client ready'));
    // client.on('end', () => logger.warn('Redis client disconnected'));

    // The connect() call is handled in server.js during startup
    // await client.connect();
    // logger.info('Redis connected successfully.');

  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Optionally, keep client as null or handle gracefully if Redis is not critical
  }
};

// Initialize client on module load, but actual connection is in server.js
connectRedis();

module.exports = {
  client: client,
  connectRedis,
};