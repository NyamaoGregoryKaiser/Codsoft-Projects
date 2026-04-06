const jwt = require('jsonwebtoken');
const config = require('../config');
const { UnauthorizedError, ForbiddenError } = require('../utils/errorHandler');
const logger = require('../config/logger');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(new UnauthorizedError('No token provided.'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwt.secret);
        req.user = decoded; // Attach user payload to the request
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new UnauthorizedError('Token expired.'));
        }
        logger.error('JWT verification failed:', err.message);
        return next(new UnauthorizedError('Invalid token.'));
    }
};

const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return next(new UnauthorizedError('Authentication required.'));
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return next(new ForbiddenError('Access denied. You do not have the required permissions.'));
        }

        next();
    };
};

module.exports = {
    authenticate,
    authorize,
};