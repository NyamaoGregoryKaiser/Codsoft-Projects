const logger = require('../config/logger');
const { ApiError } = require('../utils/errorHandler');

const errorHandler = (err, req, res, next) => {
    // Log the error for debugging
    logger.error(err);

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
            errors: err.errors,
        });
    }

    // Handle Joi validation errors
    if (err && err.isJoi) {
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors: err.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message,
            })),
        });
    }

    // Default to 500 server error
    res.status(500).json({
        status: 'error',
        message: 'An unexpected internal server error occurred.',
    });
};

module.exports = errorHandler;