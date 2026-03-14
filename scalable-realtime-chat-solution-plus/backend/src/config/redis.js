```javascript
/**
 * @file Configures and exports the Redis client.
 * @module config/redis
 */

const Redis = require('ioredis');
const config = require('./index');
const logger = require('../utils/logger');

const redisConfig = config.redis;

const redisClient = new Redis({
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password,
    lazyConnect: true, // Only connect when a command is issued
    maxRetriesPerRequest: null, // Allow unlimited retries for connection issues
});

redisClient.on('connect', () => {
    logger.info('Redis client connected to server.');
});

redisClient.on('ready', () => {
    logger.info('Redis client is ready to use.');
});

redisClient.on('error', (err) => {
    logger.error('Redis client error:', err);
    // Optionally implement reconnection logic here if lazyConnect isn't enough
});

redisClient.on('end', () => {
    logger.warn('Redis client connection closed.');
});

/**
 * Connects the Redis client.
 * @async
 * @function connectRedis
 * @returns {Promise<void>}
 */
const connectRedis = async () => {
    try {
        await redisClient.connect();
        logger.info('Redis connected successfully.');
    } catch (error) {
        logger.error('Could not connect to Redis:', error);
        // Do not exit process, Redis might be optional for some features (e.g., caching but not core functionality)
    }
};

module.exports = {
    redisClient,
    connectRedis,
};
```