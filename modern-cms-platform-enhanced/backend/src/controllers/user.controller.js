```javascript
const userService = require('../services/user.service');
const logger = require('../utils/logger');
const { deleteCache } = require('../utils/cache');

// Cache key for all users
const ALL_USERS_CACHE_KEY = '/api/users';

/**
 * Get all users. (Admin only)
 */
exports.getAllUsers = async (req, res, next) => {
    try {
        const users = await userService.findAllUsers();
        res.status(200).json(users);
    } catch (error) {
        logger.error('Error fetching all users:', error.message);
        next(error);
    }
};

/**
 * Get a single user by ID. (Admin only)
 */
exports.getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await userService.findUserById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        logger.error(`Error fetching user by ID ${req.params.id}:`, error.message);
        next(error);
    }
};

/**
 * Update a user. (Admin only)
 */
exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updatedUser = await userService.updateUser(id, req.body);
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }
        deleteCache(ALL_USERS_CACHE_KEY); // Invalidate cache
        deleteCache(`/api/users/${id}`); // Invalidate specific user cache
        res.status(200).json({ message: 'User updated successfully.', user: updatedUser });
    } catch (error) {
        logger.error(`Error updating user ${req.params.id}:`, error.message);
        next(error);
    }
};

/**
 * Delete a user. (Admin only)
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const success = await userService.deleteUser(id);
        if (!success) {
            return res.status(404).json({ message: 'User not found.' });
        }
        deleteCache(ALL_USERS_CACHE_KEY); // Invalidate cache
        deleteCache(`/api/users/${id}`); // Invalidate specific user cache
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        logger.error(`Error deleting user ${req.params.id}:`, error.message);
        next(error);
    }
};
```