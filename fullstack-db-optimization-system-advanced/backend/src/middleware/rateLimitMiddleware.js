const rateLimit = require('express-rate-limit');
const config = require('@config');
const logger = require('@utils/logger');

// Global rate limiting for all API requests
const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Max requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after a minute',
    errorType: 'RateLimitError',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});

// Specific rate limit for authentication routes (e.g., login/register)
const authRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: Math.floor(config.rateLimit.maxRequests / 5), // E.g., 20 requests per minute for auth
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after a minute',
    errorType: 'AuthRateLimitError',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  globalRateLimiter,
  authRateLimiter,
};