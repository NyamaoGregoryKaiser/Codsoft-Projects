```javascript
/**
 * @file Handles authentication-related business logic.
 * @module services/authService
 */

const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiErrors');

/**
 * Registers a new user.
 * @param {object} userData - User registration data (username, email, password).
 * @returns {Promise<object>} - Registered user data (excluding password) and a JWT token.
 * @throws {APIError} If user already exists or validation fails.
 */
exports.registerUser = async (userData) => {
    const { username, email, password } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
        where: {
            [require('sequelize').Op.or]: [{ email }, { username }],
        },
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new APIError('User with this email already exists.', 409);
        }
        if (existingUser.username === username) {
            throw new APIError('User with this username already exists.', 409);
        }
    }

    try {
        const newUser = await User.create({ username, email, password });
        const token = generateToken(newUser.id);

        logger.info(`User registered: ${newUser.username} (${newUser.id})`);

        // Exclude password from the returned object
        const userResponse = newUser.toJSON();
        delete userResponse.password;

        return { user: userResponse, token };
    } catch (error) {
        // Sequelize validation errors
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            throw new APIError(messages.join(', '), 400);
        }
        logger.error(`Error registering user ${username}:`, error);
        throw new APIError('Failed to register user.', 500);
    }
};

/**
 * Logs in an existing user.
 * @param {string} identifier - Username or email.
 * @param {string} password - User's password.
 * @returns {Promise<object>} - Logged-in user data (excluding password) and a JWT token.
 * @throws {APIError} If credentials are invalid.
 */
exports.loginUser = async (identifier, password) => {
    // Retrieve user including password for comparison
    const user = await User.scope('withPassword').findOne({
        where: {
            [require('sequelize').Op.or]: [
                { email: identifier },
                { username: identifier },
            ],
        },
    });

    if (!user || !(await user.comparePassword(password))) {
        throw new APIError('Invalid credentials.', 401);
    }

    const token = generateToken(user.id);
    await user.update({ status: 'online', lastSeen: new Date() }); // Update user status on login

    logger.info(`User logged in: ${user.username} (${user.id})`);

    // Exclude password from the returned object
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
};

/**
 * Logs out a user.
 * @param {string} userId - The ID of the user to log out.
 * @returns {Promise<void>}
 */
exports.logoutUser = async (userId) => {
    const user = await User.findByPk(userId);
    if (user) {
        await user.update({ status: 'offline', lastSeen: new Date() });
        logger.info(`User logged out: ${user.username} (${user.id})`);
    }
};

/**
 * Retrieves a user by ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<object>} - User data (excluding password).
 * @throws {APIError} If user not found.
 */
exports.getUserProfile = async (userId) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new APIError('User not found.', 404);
    }
    return user.toJSON(); // Password already excluded by default scope
};

/**
 * Updates a user's profile.
 * @param {string} userId - The ID of the user to update.
 * @param {object} updateData - Data to update (e.g., username, email, password).
 * @returns {Promise<object>} - Updated user data (excluding password).
 * @throws {APIError} If user not found or validation fails.
 */
exports.updateUserProfile = async (userId, updateData) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new APIError('User not found.', 404);
    }

    try {
        await user.update(updateData);
        logger.info(`User profile updated: ${user.username} (${user.id})`);
        return user.toJSON();
    } catch (error) {
        if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
            const messages = error.errors.map(err => err.message);
            throw new APIError(messages.join(', '), 400);
        }
        logger.error(`Error updating user ${userId}:`, error);
        throw new APIError('Failed to update user profile.', 500);
    }
};
```