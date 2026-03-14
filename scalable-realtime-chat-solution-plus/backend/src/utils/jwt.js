```javascript
/**
 * @file Utility functions for JSON Web Token (JWT) handling.
 * @module utils/jwt
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { APIError } = require('./apiErrors');
const logger = require('./logger');

/**
 * Generates a JWT token for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {string} The generated JWT token.
 */
exports.generateToken = (userId) => {
    const payload = { id: userId };
    const options = {
        expiresIn: config.jwt.expiresIn,
    };
    return jwt.sign(payload, config.jwt.secret, options);
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object} The decoded payload if the token is valid.
 * @throws {APIError} If the token is invalid or expired.
 */
exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwt.secret);
    } catch (error) {
        logger.error('JWT verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            throw new APIError('Token expired.', 401);
        }
        throw new APIError('Invalid token.', 401);
    }
};

/**
 * Verifies a JWT token for Socket.IO connections.
 * This version specifically for socket.io middleware, which needs to call `next(error)`
 * instead of throwing an APIError directly.
 * @param {string} token - The JWT token to verify.
 * @returns {object} The decoded payload if the token is valid.
 * @throws {Error} If the token is invalid or expired.
 */
exports.verifyTokenSocket = (token) => {
    return jwt.verify(token, config.jwt.secret);
    // Note: This relies on the calling socket.io middleware to catch the error
    // and call `next(new Error(...))`
};
```