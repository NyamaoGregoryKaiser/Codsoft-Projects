```javascript
const { createClient } = require('redis');
const config = require('../config/config');
const logger = require('./logger');

const client = createClient({
    url: `redis://${config.redis.password ? `:${config.redis.password}@` : ''}${config.redis.host}:${config.redis.port}`
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis client connected.'));
client.on('ready', () => logger.info('Redis client ready to use.'));
client.on('end', () => logger.warn('Redis client disconnected.'));

/**
 * Sets a key-value pair in Redis with an optional expiration.
 * @param {string} key
 * @param {any} value - Will be JSON.stringified
 * @param {number} [expirationInSeconds] - Optional: expiration time in seconds.
 */
const setCache = async (key, value, expirationInSeconds = 3600) => { // Default 1 hour
    try {
        if (!client.isOpen) {
            await client.connect(); // Ensure client is connected before use
        }
        const stringValue = JSON.stringify(value);
        await client.set(key, stringValue, { EX: expirationInSeconds });
        logger.debug(`Cache set for key: ${key}`);
    } catch (error) {
        logger.error(`Error setting cache for key ${key}:`, error);
    }
};

/**
 * Gets a value from Redis for a given key.
 * @param {string} key
 * @returns {Promise<any | null>} Parsed value or null if not found/error.
 */
const getCache = async (key) => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
        const cachedData = await client.get(key);
        if (cachedData) {
            logger.debug(`Cache hit for key: ${key}`);
            return JSON.parse(cachedData);
        }
        logger.debug(`Cache miss for key: ${key}`);
        return null;
    } catch (error) {
        logger.error(`Error getting cache for key ${key}:`, error);
        return null;
    }
};

/**
 * Deletes a key from Redis.
 * @param {string} key
 */
const deleteCache = async (key) => {
    try {
        if (!client.isOpen) {
            await client.connect();
        }
        await client.del(key);
        logger.debug(`Cache deleted for key: ${key}`);
    } catch (error) {
        logger.error(`Error deleting cache for key ${key}:`, error);
    }
};

/**
 * Middleware to cache responses for GET requests.
 * Usage: router.get('/posts', cacheMiddleware(3600), postController.getPosts);
 * @param {number} expirationInSeconds - Cache expiration time.
 */
const cacheMiddleware = (expirationInSeconds = 3600) => async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const key = req.originalUrl; // Use full URL as cache key

    try {
        const cachedData = await getCache(key);
        if (cachedData) {
            return res.status(200).json(cachedData);
        }

        // If not in cache, proceed and then cache the response
        const originalSend = res.send;
        res.send = (body) => {
            setCache(key, JSON.parse(body), expirationInSeconds);
            originalSend.call(res, body);
        };
        next();

    } catch (error) {
        logger.error(`Cache middleware error for key ${key}:`, error);
        next(); // Continue without caching if there's an error
    }
};

module.exports = {
    client,
    setCache,
    getCache,
    deleteCache,
    cacheMiddleware,
};
```