```javascript
/**
 * @file Handles message-related business logic.
 * @module services/messageService
 */

const { Message, User, Room } = require('../models');
const { APIError } = require('../utils/apiErrors');
const logger = require('../utils/logger');

/**
 * Sends a new message to a room.
 * @param {string} senderId - The ID of the user sending the message.
 * @param {string} roomId - The ID of the room where the message is sent.
 * @param {string} content - The content of the message.
 * @returns {Promise<object>} - The created message object including sender info.
 * @throws {APIError} If sender or room not found, or validation fails.
 */
exports.sendMessage = async (senderId, roomId, content) => {
    const sender = await User.findByPk(senderId);
    if (!sender) {
        throw new APIError('Sender not found.', 404);
    }

    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new APIError('Room not found.', 404);
    }

    // Optional: Check if sender is a member of the room
    const isMember = await room.hasMember(sender);
    if (!isMember && room.isPrivate) { // For private rooms, enforce membership
        throw new APIError('You are not a member of this room.', 403);
    } else if (!isMember && !room.isPrivate) { // Auto-join public rooms if not a member? Or disallow sending?
        // For now, allow sending in public rooms even if not explicitly "joined" via `UserRooms`
        // if the model structure means "joining" is explicit.
        // Or, more realistically, `joinRoom` should be called first.
        // For this example, let's assume if a user is not a member of a public room, they can't send messages either
        // This implies explicit joining for all rooms.
        throw new APIError('You must join this room to send messages.', 403);
    }


    try {
        const message = await Message.create({
            senderId,
            roomId,
            content,
        });

        // Eager load sender for the real-time broadcast
        const fullMessage = await Message.findByPk(message.id, {
            include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }]
        });

        logger.info(`Message sent by ${sender.username} in room ${room.name}: "${content.substring(0, 50)}..."`);
        return fullMessage;
    } catch (error) {
        if (error.name === 'SequelizeValidationError') {
            const messages = error.errors.map(err => err.message);
            throw new APIError(messages.join(', '), 400);
        }
        logger.error(`Error sending message for user ${senderId} in room ${roomId}:`, error);
        throw new APIError('Failed to send message.', 500);
    }
};

/**
 * Retrieves messages for a specific room.
 * @param {string} roomId - The ID of the room.
 * @param {object} options - Pagination options (limit, offset).
 * @returns {Promise<Array<object>>} - An array of message objects.
 */
exports.getMessagesInRoom = async (roomId, { limit = 50, offset = 0 } = {}) => {
    // This function is already present in roomService, but can also be here if message-specific.
    // Keeping it here for message-specific context and separation.
    const messages = await Message.findAll({
        where: { roomId },
        include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']], // Newest first
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
    });
    return messages.reverse(); // Return oldest first for chat display
};
```