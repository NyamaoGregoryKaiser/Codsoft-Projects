```javascript
/**
 * @file Handles chat room related business logic.
 * @module services/roomService
 */

const { Room, User, Message } = require('../models');
const { APIError } = require('../utils/apiErrors');
const logger = require('../utils/logger');

/**
 * Creates a new chat room.
 * @param {object} roomData - Data for the new room (name, description, isPrivate).
 * @param {string} creatorId - The ID of the user creating the room.
 * @returns {Promise<object>} - The created room object.
 * @throws {APIError} If room name already exists or validation fails.
 */
exports.createRoom = async (roomData, creatorId) => {
    const { name, description, isPrivate } = roomData;

    try {
        const newRoom = await Room.create({
            name,
            description,
            isPrivate,
            creatorId,
        });

        // Add the creator as a member of the room
        const user = await User.findByPk(creatorId);
        if (user) {
            await newRoom.addMember(user);
        }

        logger.info(`Room created: ${newRoom.name} (${newRoom.id}) by user ${creatorId}`);
        return newRoom;
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            throw new APIError(messages.join(', '), 400);
        }
        logger.error(`Error creating room ${name}:`, error);
        throw new APIError('Failed to create room.', 500);
    }
};

/**
 * Retrieves a list of all public chat rooms.
 * @returns {Promise<Array<object>>} - An array of room objects.
 */
exports.getAllRooms = async () => {
    return Room.findAll({
        where: { isPrivate: false },
        include: [{ model: User, as: 'members', attributes: ['id', 'username', 'status'] }],
    });
};

/**
 * Retrieves a specific room by its ID.
 * @param {string} roomId - The ID of the room to retrieve.
 * @returns {Promise<object>} - The room object.
 * @throws {APIError} If room not found.
 */
exports.getRoomById = async (roomId) => {
    const room = await Room.findByPk(roomId, {
        include: [{ model: User, as: 'members', attributes: ['id', 'username', 'status'] }],
    });
    if (!room) {
        throw new APIError('Room not found.', 404);
    }
    return room;
};

/**
 * Updates a room's details.
 * @param {string} roomId - The ID of the room to update.
 * @param {object} updateData - Data to update (name, description, isPrivate).
 * @param {string} userId - The ID of the user attempting to update.
 * @returns {Promise<object>} - The updated room object.
 * @throws {APIError} If room not found, user is not authorized, or validation fails.
 */
exports.updateRoom = async (roomId, updateData, userId) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new APIError('Room not found.', 404);
    }

    // Only allow creator to update room details (or an admin role)
    if (room.creatorId !== userId) {
        throw new APIError('You are not authorized to update this room.', 403);
    }

    try {
        await room.update(updateData);
        logger.info(`Room updated: ${room.name} (${room.id})`);
        return room;
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            throw new APIError(messages.join(', '), 400);
        }
        logger.error(`Error updating room ${roomId}:`, error);
        throw new APIError('Failed to update room.', 500);
    }
};

/**
 * Deletes a chat room.
 * @param {string} roomId - The ID of the room to delete.
 * @param {string} userId - The ID of the user attempting to delete.
 * @returns {Promise<void>}
 * @throws {APIError} If room not found or user is not authorized.
 */
exports.deleteRoom = async (roomId, userId) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new APIError('Room not found.', 404);
    }

    if (room.creatorId !== userId) {
        throw new APIError('You are not authorized to delete this room.', 403);
    }

    try {
        await room.destroy();
        logger.info(`Room deleted: ${room.name} (${room.id})`);
    } catch (error) {
        logger.error(`Error deleting room ${roomId}:`, error);
        throw new APIError('Failed to delete room.', 500);
    }
};

/**
 * Adds a user to a room.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user to add.
 * @returns {Promise<void>}
 * @throws {APIError} If room or user not found, or user is already a member.
 */
exports.joinRoom = async (roomId, userId) => {
    const room = await Room.findByPk(roomId);
    if (!room) throw new APIError('Room not found.', 404);

    const user = await User.findByPk(userId);
    if (!user) throw new APIError('User not found.', 404);

    const isMember = await room.hasMember(user);
    if (isMember) {
        throw new APIError('User is already a member of this room.', 409);
    }

    await room.addMember(user);
    logger.info(`User ${user.username} (${userId}) joined room ${room.name} (${roomId})`);
};

/**
 * Removes a user from a room.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user to remove.
 * @returns {Promise<void>}
 * @throws {APIError} If room or user not found, or user is not a member.
 */
exports.leaveRoom = async (roomId, userId) => {
    const room = await Room.findByPk(roomId);
    if (!room) throw new APIError('Room not found.', 404);

    const user = await User.findByPk(userId);
    if (!user) throw new APIError('User not found.', 404);

    const isMember = await room.hasMember(user);
    if (!isMember) {
        throw new APIError('User is not a member of this room.', 404);
    }

    await room.removeMember(user);
    logger.info(`User ${user.username} (${userId}) left room ${room.name} (${roomId})`);
};

/**
 * Retrieves messages for a specific room.
 * @param {string} roomId - The ID of the room.
 * @param {object} options - Pagination options (limit, offset).
 * @returns {Promise<Array<object>>} - An array of message objects.
 * @throws {APIError} If room not found.
 */
exports.getRoomMessages = async (roomId, { limit = 50, offset = 0 } = {}) => {
    const room = await Room.findByPk(roomId);
    if (!room) {
        throw new APIError('Room not found.', 404);
    }

    // You might want to check if the requesting user is a member of the room for private rooms
    // For now, assuming public access to messages for simplicity or that auth middleware ensures membership
    const messages = await Message.findAll({
        where: { roomId },
        include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }],
        order: [['createdAt', 'ASC']],
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
    });

    return messages;
};
```