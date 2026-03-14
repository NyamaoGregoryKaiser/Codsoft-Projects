```javascript
const Message = require('../models/Message');
const Room = require('../models/Room');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/winston');
const cacheService = require('./cacheService');

/**
 * Get messages for a specific room.
 * @param {string} roomId - The ID of the room.
 * @param {number} page - Current page number.
 * @param {number} limit - Number of messages per page.
 * @returns {Array<Message>} List of messages.
 * @throws {ErrorResponse} If room not found.
 */
exports.getMessagesInRoom = async (roomId, page = 1, limit = 50) => {
  const room = await Room.findById(roomId);
  if (!room) {
    logger.warn(`Attempted to get messages for non-existent room: ${roomId}`);
    throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  }

  const skip = (page - 1) * limit;

  // Try to fetch from cache first for recent messages
  if (page === 1) {
    const cachedMessages = await cacheService.getCachedRecentMessages(roomId, limit);
    if (cachedMessages && cachedMessages.length > 0) {
      logger.debug(`Fetched messages for room ${roomId} from cache.`);
      return cachedMessages;
    }
  }

  const messages = await Message.find({ room: roomId })
    .populate({
      path: 'sender',
      select: 'username'
    })
    .sort({ timestamp: -1 }) // Newest first for pagination
    .skip(skip)
    .limit(limit);

  // Cache the first page of messages
  if (page === 1 && messages.length > 0) {
    await cacheService.setCachedRecentMessages(roomId, messages);
    logger.debug(`Cached recent messages for room ${roomId}.`);
  }

  logger.debug(`Fetched messages for room ${roomId}, page ${page}.`);
  return messages;
};

/**
 * Create a new message.
 * @param {string} roomId - The ID of the room.
 * @param {string} senderId - The ID of the sender.
 * @param {string} content - The message content.
 * @returns {Message} The created message object.
 * @throws {ErrorResponse} If room or sender not found.
 */
exports.createMessage = async (roomId, senderId, content) => {
  const room = await Room.findById(roomId);
  if (!room) {
    logger.warn(`Attempted to create message in non-existent room: ${roomId}`);
    throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  }

  // Basic check if sender is part of the room (can be enhanced for private rooms)
  if (!room.members.includes(senderId)) {
    logger.warn(`User ${senderId} attempted to send message to room ${roomId} without membership.`);
    throw new ErrorResponse('You are not a member of this room', 403);
  }

  const message = await Message.create({
    room: roomId,
    sender: senderId,
    content
  });

  // Populate sender for real-time broadcast and cache
  await message.populate({ path: 'sender', select: 'username' });

  // Invalidate or update cache for this room
  await cacheService.invalidateRecentMessages(roomId);
  // Optional: Add new message to cache directly if it's within the first X messages
  // This would require a more complex cache update logic (e.g., LIFO)

  logger.info(`Message sent to room ${roomId} by user ${senderId}: ${message._id}`);
  return message;
};
```