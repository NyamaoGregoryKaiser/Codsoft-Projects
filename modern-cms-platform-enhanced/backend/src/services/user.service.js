```javascript
const { User } = require('../models');
const logger = require('../utils/logger');

/**
 * Find all users.
 * @returns {Promise<User[]>} An array of user objects, excluding passwords.
 */
exports.findAllUsers = async () => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        logger.debug('Fetched all users.');
        return users;
    } catch (error) {
        logger.error('Error in findAllUsers:', error);
        throw new Error('Could not fetch users.');
    }
};

/**
 * Find a user by ID.
 * @param {string} id - The UUID of the user.
 * @returns {Promise<User|null>} The user object (excluding password) or null if not found.
 */
exports.findUserById = async (id) => {
    try {
        const user = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        logger.debug(`Fetched user by ID: ${id}`);
        return user;
    } catch (error) {
        logger.error(`Error in findUserById for ${id}:`, error);
        throw new Error('Could not fetch user.');
    }
};

/**
 * Update a user's information.
 * @param {string} id - The UUID of the user to update.
 * @param {Object} userData - Data to update (username, email, role, isActive).
 * @returns {Promise<User|null>} The updated user object (excluding password) or null if not found.
 */
exports.updateUser = async (id, userData) => {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return null;
        }

        // Prevent updating password through this route
        if (userData.password) {
            delete userData.password;
        }

        // Prevent self-demotion or changing own role to less privileged without specific logic
        // For simplicity, admin can change any role.
        if (userData.role && !['admin', 'author', 'viewer'].includes(userData.role)) {
            const error = new Error('Invalid role specified.');
            error.status = 400;
            throw error;
        }

        await user.update(userData);
        logger.info(`User ${id} updated.`);

        // Return the updated user without the password
        const updatedUser = await User.findByPk(id, {
            attributes: { exclude: ['password'] }
        });
        return updatedUser;
    } catch (error) {
        logger.error(`Error in updateUser for ${id}:`, error);
        if (error.name === 'SequelizeValidationError') {
            const validationError = new Error(error.errors.map(e => e.message).join(', '));
            validationError.status = 400;
            throw validationError;
        }
        if (error.name === 'SequelizeUniqueConstraintError') {
            const uniqueError = new Error(`The ${error.fields ? Object.keys(error.fields)[0] : 'field'} is already taken.`);
            uniqueError.status = 409;
            throw uniqueError;
        }
        throw new Error('Could not update user.');
    }
};

/**
 * Delete a user.
 * @param {string} id - The UUID of the user to delete.
 * @returns {Promise<boolean>} True if user was deleted, false if not found.
 */
exports.deleteUser = async (id) => {
    try {
        const user = await User.findByPk(id);
        if (!user) {
            return false;
        }

        await user.destroy();
        logger.info(`User ${id} deleted.`);
        return true;
    } catch (error) {
        logger.error(`Error in deleteUser for ${id}:`, error);
        throw new Error('Could not delete user.');
    }
};
```