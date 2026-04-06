const redis = require('redis');
const config = require('../config');
const logger = require('../config/logger');

const client = redis.createClient({
    url: `redis://${config.redis.host}:${config.redis.port}`
});

client.on('error', (err) => logger.error('Redis Client Error', err));
client.on('connect', () => logger.info('Redis client connected.'));

// Connect to Redis only once when the module is loaded
client.connect().catch(err => {
    logger.error('Failed to connect to Redis on startup:', err.message);
});

class CacheService {
    /**
     * Set a key-value pair in Redis with an optional expiry.
     * @param {string} key
     * @param {any} value
     * @param {number} [ttlSeconds] Time to live in seconds.
     */
    static async set(key, value, ttlSeconds) {
        try {
            const stringValue = JSON.stringify(value);
            if (ttlSeconds) {
                await client.setEx(key, ttlSeconds, stringValue);
            } else {
                await client.set(key, stringValue);
            }
            logger.debug(`Cache set for key: ${key}`);
            return true;
        } catch (error) {
            logger.error(`Error setting cache for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get a value from Redis by key.
     * @param {string} key
     * @returns {Promise<any | null>}
     */
    static async get(key) {
        try {
            const value = await client.get(key);
            if (value) {
                logger.debug(`Cache hit for key: ${key}`);
                return JSON.parse(value);
            }
            logger.debug(`Cache miss for key: ${key}`);
            return null;
        } catch (error) {
            logger.error(`Error getting cache for key ${key}:`, error.message);
            return null;
        }
    }

    /**
     * Delete a key from Redis.
     * @param {string} key
     */
    static async del(key) {
        try {
            await client.del(key);
            logger.debug(`Cache deleted for key: ${key}`);
            return true;
        } catch (error) {
            logger.error(`Error deleting cache for key ${key}:`, error.message);
            return false;
        }
    }

    /**
     * Get the Redis client instance directly.
     * @returns {redis.RedisClientType}
     */
    static getClient() {
        return client;
    }
}

module.exports = CacheService;