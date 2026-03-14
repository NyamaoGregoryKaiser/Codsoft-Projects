```javascript
/**
 * @file Handles HTTP requests related to user management (beyond authentication).
 * @module controllers/userController
 */

const authService = require('../services/authService'); // Reusing user-related logic
const { APIError } = require('../utils/apiErrors');
const logger = require('../utils/logger');
const Joi = require('joi');

/**
 * Joi schema for updating user status (used by Socket.IO, but can also be an HTTP endpoint).
 */
const updateStatusSchema = Joi.object({
    status: Joi.string().valid('online', 'offline', 'away').required(),
});

/**
 * Retrieves a list of all users.
 * @async
 * @function getAllUsers
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        // This would typically be a separate service method if it's more complex,
        // but for now, we can query directly or expose via authService.
        const users = await require('../models').User.findAll({
            attributes: ['id', 'username', 'email', 'status', 'lastSeen', 'createdAt'],
            order: [['username', 'ASC']],
        });
        res.status(200).json(users);
    } catch (error) {
        logger.error('Error fetching all users:', error);
        next(new APIError('Failed to fetch users.', 500));
    }
};

/**
 * Retrieves a specific user by ID.
 * @async
 * @function getUserById
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await authService.getUserProfile(id); // Reusing service method
        res.status(200).json(user);
    } catch (error) {
        next(error);
    }
};

/**
 * Updates a user's status.
 * Note: While this can be an HTTP endpoint, status updates are typically handled by Socket.IO.
 * This is an example for demonstration.
 * @async
 * @function updateStatus
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.updateStatus = async (req, res, next) => {
    try {
        const { error, value } = updateStatusSchema.validate(req.body);
        if (error) {
            throw new APIError(error.details[0].message, 400);
        }

        const { status } = value;
        const userId = req.user.id; // From auth middleware

        const user = await require('../models').User.findByPk(userId);
        if (!user) {
            throw new APIError('User not found.', 404);
        }

        await user.update({ status, lastSeen: new Date() });
        logger.info(`User ${user.username} (${userId}) status updated to ${status}`);

        // Emit status update via Socket.IO if available (demonstrative)
        if (req.app.get('io')) {
            req.app.get('io').emit('user:status:update', { userId, status });
        }

        res.status(200).json({ message: `Status updated to ${status}`, user: user.toJSON() });
    } catch (error) {
        next(error);
    }
};
```