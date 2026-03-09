```javascript
const logger = require('../utils/logger');

/**
 * Async handler for routes to catch errors.
 * Wraps async functions to automatically call next(error) on promise rejection.
 * @param {Function} fn - The async function to wrap.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handling middleware.
 * @param {Error} err - The error object.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // If status code wasn't set, default to 500
  res.status(statusCode);

  const errorResponse = {
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack, // Don't expose stack in production
  };

  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - IP: ${req.ip}`, {
    stack: err.stack,
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      user: req.user ? req.user.id : 'N/A',
    },
  });

  res.json(errorResponse);
};

module.exports = errorHandler;
module.exports.asyncHandler = asyncHandler;
```