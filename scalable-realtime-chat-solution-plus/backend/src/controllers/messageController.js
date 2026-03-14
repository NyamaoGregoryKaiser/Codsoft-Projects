```javascript
/**
 * @file Handles HTTP requests related to messages.
 * @module controllers/messageController
 */

const messageService = require('../services/messageService');
const { APIError } = require('../utils/apiErrors');
const Joi = require('joi');
const logger = require('../utils/logger');

/**
 * Joi schema for sending a message.
 */
const sendMessageSchema = Joi.object({
    roomId: Joi.string().uuid().required(),
    content: Joi.string().min(1).max(5000).required(),
});

/**
 * Sends a new message to a room.
 * This is an HTTP endpoint for sending messages. Real-time messages are typically
 * handled via Socket.IO, but this provides a REST fallback/alternative.
 * @async
 * @function sendMessage
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.sendMessage = async (req, res, next) => {
    try {
        const { error, value } = sendMessageSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const { roomId, content } = value;
        const senderId = req.user.id; // From auth middleware

        const message = await messageService.sendMessage(senderId, roomId, content);

        // Emit the message to the specific room via Socket.IO
        if (req.app.get('io')) {
            req.app.get('io').to(roomId).emit('chat:message', message);
            logger.debug(`Socket.IO emitted 'chat:message' to room ${roomId} for message ${message.id}`);
        }

        res.status(201).json({
            message: 'Message sent successfully',
            message: message.toJSON(), // Ensure password is removed if sender is included
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves messages for a specific room.
 * Note: This function is redundant if `roomController.getMessages` is used for API.
 * This is kept for clear separation of concerns if message-specific endpoints were needed.
 * For this project, `roomController.getMessages` is preferred for API consistency.
 * @async
 * @function getRoomMessages
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getRoomMessages = async (req, res, next) => {
    try {
        const { roomId } = req.params;
        const { limit, offset } = req.query; // Pagination

        // This check would ideally be handled by a middleware for consistency
        const room = await require('../services/roomService').getRoomById(roomId);
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