```javascript
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Generates a JWT token for a given user.
 * @param {Object} user - User object from the database.
 * @returns {string} JWT token.
 */
const generateToken = (user) => {
    return jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
        expiresIn: config.jwtExpiresIn,
    });
};

/**
 * Registers a new user.
 * @param {Object} userData - User data (username, email, password, optional role).
 * @returns {Promise<User>} The created user object.
 * @throws {Error} If user creation fails or validation errors.
 */
exports.registerUser = async ({ username, email, password, role = 'viewer' }) => {
    try {
        // Check if user already exists
        let userExists = await User.findOne({ where: { email } });
        if (userExists) {
            const error = new Error('User with that email already exists.');
            error.status = 400;
            throw error;
        }

        userExists = await User.findOne({ where: { username } });
        if (userExists) {
            const error = new Error('User with that username already exists.');
            error.status = 400;
            throw error;
        }

        // Create user
        const user = await User.create({
            username,
            email,
            password,
            role, // Default to 'viewer', can be specified for initial admin setup
        });

        logger.info(`User registered: ${user.email}`);
        return user;
    } catch (error) {
        logger.error('Error during user registration:', error);
        if (error.name === 'SequelizeValidationError') {
            const validationError = new Error(error.errors.map(e => e.message).join(', '));
            validationError.status = 400;
            throw validationError;
        }
        throw error;
    }
};

/**
 * Logs in a user.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Promise<{user: User, token: string}>} User object and JWT token.
 * @throws {Error} If login fails due to invalid credentials or user not found.
 */
exports.loginUser = async (email, password) => {
    try {
        // Check for user email
        const user = await User.findOne({ where: { email } });

        if (!user) {
            const error = new Error('Invalid credentials.');
            error.status = 401;
            throw error;
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const error = new Error('Invalid credentials.');
            error.status = 401;
            throw error;
        }

        if (!user.isActive) {
            const error = new Error('Your account is inactive. Please contact support.');
            error.status = 403;
            throw error;
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save({ fields: ['lastLogin'] }); // Only save 'lastLogin' field

        // Generate token
        const token = generateToken(user);

        logger.info(`User logged in: ${user.email}`);
        return { user, token };
    } catch (error) {
        logger.error('Error during user login:', error);
        throw error;
    }
};
```