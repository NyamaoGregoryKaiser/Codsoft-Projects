```javascript
const redisClient = require('../config/redis');
const logger = require('../config/winston');

const ONLINE_USERS_KEY = 'online_users';
const RECENT_MESSAGES_PREFIX = 'recent_messages:';
const CACHE_EXPIRATION_SECONDS = 300; // 5 minutes for messages cache

/**
 * Add a user to the online users set.
 * @param {string} userId - The ID of the user to add.
 * @param {string} username - The username of the user.
 */
exports.addOnlineUser = async (userId, username) => {
  try {
    await redisClient.hSet(ONLINE_USERS_KEY, userId, username);
    logger.debug(`User ${username} (${userId}) added to online cache.`);
  } catch (error) {
    logger.error(`Error adding online user to cache: ${error.message}`);
  }
};

/**
 * Remove a user from the online users set.
 * @param {string} userId - The ID of the user to remove.
 */
exports.removeOnlineUser = async (userId) => {
  try {
    await redisClient.hDel(ONLINE_USERS_KEY, userId);
    logger.debug(`User ${userId} removed from online cache.`);
  } catch (error) {
    logger.error(`Error removing online user from cache: ${error.message}`);
  }
};

/**
 * Get all online users.
 * @returns {Object} An object where keys are user IDs and values are usernames.
 */
exports.getOnlineUsers = async () => {
  try {
    const users = await redisClient.hGetAll(ONLINE_USERS_KEY);
    logger.debug('Fetched all online users from cache.');
    return users;
  } catch (error) {
    logger.error(`Error fetching online users from cache: ${error.message}`);
    return {};
  }
};

/**
 * Cache recent messages for a specific room.
 * @param {string} roomId - The ID of the room.
 * @param {Array<Object>} messages - The array of message objects to cache.
 */
exports.setCachedRecentMessages = async (roomId, messages) => {
  try {
    const key = `${RECENT_MESSAGES_PREFIX}${roomId}`;
    await redisClient.setEx(key, CACHE_EXPIRATION_SECONDS, JSON.stringify(messages));
    logger.debug(`Cached recent messages for room ${roomId}.`);
  } catch (error) {
    logger.error(`Error setting cached recent messages for room ${roomId}: ${error.message}`);
  }
};

/**
 * Retrieve cached recent messages for a specific room.
 * @param {string} roomId - The ID of the room.
 * @returns {Array<Object>|null} The cached messages or null if not found.
 */
exports.getCachedRecentMessages = async (roomId) => {
  try {
    const key = `${RECENT_MESSAGES_PREFIX}${roomId}`;
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      logger.debug(`Retrieved cached recent messages for room ${roomId}.`);
      return JSON.parse(cachedData);
    }
    return null;
  } catch (error) {
    logger.error(`Error getting cached recent messages for room ${roomId}: ${error.message}`);
    return null;
  }
};

/**
 * Invalidate recent messages cache for a specific room.
 * @param {string} roomId - The ID of the room.
 */
exports.invalidateRecentMessages = async (roomId) => {
  try {
    const key = `${RECENT_MESSAGES_PREFIX}${roomId}`;
    await redisClient.del(key);
    logger.debug(`Invalidated recent messages cache for room ${roomId}.`);
  } catch (error) {
    logger.error(`Error invalidating recent messages cache for room ${roomId}: ${error.message}`);
  }
};
```