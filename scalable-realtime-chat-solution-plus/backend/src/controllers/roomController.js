```javascript
/**
 * @file Handles HTTP requests related to chat rooms.
 * @module controllers/roomController
 */

const roomService = require('../services/roomService');
const messageService = require('../services/messageService');
const { APIError } = require('../utils/apiErrors');
const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Joi schema for creating a room.
 */
const createRoomSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().max(255).allow('').optional(),
    isPrivate: Joi.boolean().default(false).optional(),
});

/**
 * Joi schema for updating a room.
 */
const updateRoomSchema = Joi.object({
    name: Joi.string().min(3).max(50).optional(),
    description: Joi.string().max(255).allow('').optional(),
    isPrivate: Joi.boolean().optional(),
}).min(1); // At least one field required for update

/**
 * Joi schema for joining/leaving a room.
 */
const joinLeaveRoomSchema = Joi.object({
    userId: Joi.string().uuid().required(),
});


/**
 * Creates a new chat room.
 * @async
 * @function createRoom
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.createRoom = async (req, res, next) => {
    try {
        const { error, value } = createRoomSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const room = await roomService.createRoom(value, req.user.id);
        res.status(201).json({
            message: 'Room created successfully',
            room,
        });

        // Emit new room event to all connected clients
        if (req.app.get('io')) {
            req.app.get('io').emit('room:new', room);
            logger.debug(`Socket.IO emitted 'room:new' for room ${room.id}`);
        }

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves all available chat rooms.
 * @async
 * @function getAllRooms
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getAllRooms = async (req, res, next) => {
    try {
        const rooms = await roomService.getAllRooms();
        res.status(200).json(rooms);
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves a specific chat room by ID.
 * @async
 * @function getRoomById
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getRoomById = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const room = await roomService.getRoomById(roomId);
        res.status(200).json(room);
    } catch (error) {
        next(error);
    }
};

/**
 * Updates an existing chat room.
 * @async
 * @function updateRoom
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { error, value } = updateRoomSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const updatedRoom = await roomService.updateRoom(roomId, value, req.user.id);
        res.status(200).json({
            message: 'Room updated successfully',
            room: updatedRoom,
        });

        // Emit room update event
        if (req.app.get('io')) {
            req.app.get('io').emit('room:update', updatedRoom);
            logger.debug(`Socket.IO emitted 'room:update' for room ${updatedRoom.id}`);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Deletes a chat room.
 * @async
 * @function deleteRoom
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.deleteRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        await roomService.deleteRoom(roomId, req.user.id);
        res.status(204).send(); // No content for successful deletion

        // Emit room delete event
        if (req.app.get('io')) {
            req.app.get('io').emit('room:delete', { roomId });
            logger.debug(`Socket.IO emitted 'room:delete' for room ${roomId}`);
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Adds a user to a room.
 * @async
 * @function joinRoom
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.joinRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id; // User from auth middleware

        await roomService.joinRoom(roomId, userId);
        res.status(200).json({ message: 'User joined room successfully.' });

        // Emit user joined event to the room
        if (req.app.get('io')) {
            // Join the socket to the room namespace
            const io = req.app.get('io');
            const socketId = io.sockets.adapter.rooms.get(userId)?.values().next().value; // Find user's current socket
            if (socketId) {
                io.sockets.sockets.get(socketId)?.join(roomId);
            }
            io.to(roomId).emit('room:user:join', { roomId, userId, username: req.user.username });
            logger.debug(`Socket.IO emitted 'room:user:join' for user ${userId} in room ${roomId}`);
        }

    } catch (error) {
        next(error);
    }
};

/**
 * Removes a user from a room.
 * @async
 * @function leaveRoom
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.leaveRoom = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const userId = req.user.id; // User from auth middleware

        await roomService.leaveRoom(roomId, userId);
        res.status(200).json({ message: 'User left room successfully.' });

        // Emit user left event to the room
        if (req.app.get('io')) {
            // Remove the socket from the room namespace
            const io = req.app.get('io');
            const socketId = io.sockets.adapter.rooms.get(userId)?.values().next().value; // Find user's current socket
            if (socketId) {
                io.sockets.sockets.get(socketId)?.leave(roomId);
            }
            io.to(roomId).emit('room:user:leave', { roomId, userId, username: req.user.username });
            logger.debug(`Socket.IO emitted 'room:user:leave' for user ${userId} in room ${roomId}`);
        }

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves messages for a specific room.
 * @async
 * @function getMessages
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getMessages = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { limit, offset } = req.query; // Pagination

        // Check if the user is a member of the room before fetching messages for private rooms
        const room = await roomService.getRoomById(roomId); // This already throws 404 if not found
        if (room.isPrivate) {
            const user = await require('../models').User.findByPk(req.user.id);
            if (!user || !(await room.hasMember(user))) {
                throw new APIError('You are not authorized to view messages in this private room.', 403);
            }
        }

        const messages = await messageService.getMessagesInRoom(roomId, { limit, offset });
        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};
```