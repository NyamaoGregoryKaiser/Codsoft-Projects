```javascript
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Centralized error handling middleware.
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
exports.errorHandler = (err, req, res, next) => {
    const statusCode = err.status || 500;
    
    // Log error details
    logger.error(`Error ${statusCode} on ${req.method} ${req.originalUrl}: ${err.message}`, {
        stack: config.env === 'development' ? err.stack : undefined,
        error: err
    });

    res.status(statusCode).json({
        message: err.message,
        // Only send stacktrace in development mode
        stack: config.env === 'development' ? err.stack : undefined,
    });
};
```