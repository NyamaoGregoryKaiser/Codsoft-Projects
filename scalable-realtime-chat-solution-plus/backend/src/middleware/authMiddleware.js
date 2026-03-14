```javascript
/**
 * @file Express middleware for JWT authentication.
 * @module middleware/authMiddleware
 */

const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { APIError } = require('../utils/apiErrors');
const logger = require('../utils/logger');

/**
 * Authenticates requests using JWT.
 * Attaches the authenticated user object to `req.user`.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 * @returns {void}
 * @throws {APIError} If token is missing, invalid, or user not found.
 */
exports.protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        logger.warn('Auth attempt without token.');
        return next(new APIError('Not authorized, no token.', 401));
    }

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        logger.debug(`JWT decoded: User ID ${decoded.id}`);

        const user = await User.findByPk(decoded.id, {
            attributes: ['id', 'username', 'email', 'status', 'lastSeen'], // Exclude password
        });

        if (!user) {
            logger.warn(`User with ID ${decoded.id} not found from token.`);
            return next(new APIError('Not authorized, user not found.', 401));
        }

        req.user = user; // Attach user to request object
        next();
    } catch (error) {
        logger.error('JWT verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            return next(new APIError('Token expired, please log in again.', 401));
        }
        return next(new APIError('Not authorized, token failed.', 401));
    }
};

/**
 * Authorizes requests based on user roles (example).
 * @param {Array<string>} roles - Array of allowed roles (e.g., ['admin', 'moderator']).
 * @returns {function} Express middleware.
 */
exports.authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        // Assuming req.user has a 'role' property. Add to User model if needed.
        // For this project, we don't have roles, so this is just a placeholder.
        if (roles.length > 0 && (!req.user || !roles.includes(req.user.role))) {
            logger.warn(`Unauthorized access attempt by user ${req.user ? req.user.id : 'N/A'} (Role: ${req.user ? req.user.role : 'N/A'}) to restricted resource.`);
            return next(new APIError('Not authorized to access this route.', 403));
        }
        next();
    };
};
```