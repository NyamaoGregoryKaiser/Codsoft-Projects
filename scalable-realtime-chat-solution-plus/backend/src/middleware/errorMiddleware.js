```javascript
/**
 * @file Custom error handling middleware for Express.
 * @module middleware/errorMiddleware
 */

const logger = require('../utils/logger');
const { APIError } = require('../utils/apiErrors');
const config = require('../config');

/**
 * Handles all API errors, sending a standardized response.
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function (not used in final handler).
 */
exports.errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log the error
    logger.error(`Error: ${err.message}`, {
        statusCode: statusCode,
        path: req.path,
        method: req.method,
        ip: req.ip,
        stack: config.env === 'development' ? err.stack : undefined,
        originalError: err,
    });

    // Handle specific error types
    if (err instanceof APIError) {
        statusCode = err.statusCode;
        message = err.message;
    } else if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        statusCode = 400; // Bad Request
        message = err.errors.map(e => e.message).join(', ') || 'Database validation error.';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401; // Unauthorized
        message = 'Invalid token.';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401; // Unauthorized
        message = 'Token expired.';
    } else if (err.name === 'SyntaxError' && err.message.includes('JSON')) {
        statusCode = 400; // Bad Request
        message = 'Invalid JSON payload.';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message: message,
        ...(config.env === 'development' && { stack: err.stack }), // Only send stack in dev
    });
};

/**
 * Handles 404 (Not Found) errors for unmatched routes.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
exports.notFound = (req, res, next) => {
    const error = new APIError(`Not Found - ${req.originalUrl}`, 404);
    next(error);
};
```