```javascript
/**
 * @file Express middleware for API rate limiting using `express-rate-limit`.
 * Integrates with Redis for distributed rate limiting.
 * @module middleware/rateLimitMiddleware
 */

const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const config = require('../config');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// Store options for Redis
const store = new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    // You can also pass a client directly:
    // client: redisClient,
    // prefix: 'rate_limit:', // Optional: prefix for keys in Redis
});

/**
 * Global API rate limit middleware.
 * @type {function}
 */
exports.apiRateLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // 1 minute
    max: config.rateLimit.maxRequests,   // Max requests per windowMs
    store: store,
    message: async (req, res) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`);
        return {
            success: false,
            message: 'Too many requests, please try again after a minute.',
        };
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).send(options.message);
    },
    // Customize key generation if needed (e.g., by user ID after auth)
    keyGenerator: (req, res) => {
        return req.user ? req.user.id : req.ip; // Use user ID if authenticated, otherwise IP
    },
    // Headers to send with response
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

/**
 * More strict rate limit for authentication routes (login, register).
 * @type {function}
 */
exports.authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,                   // Max 5 requests per 15 minutes
    store: store,
    message: async (req, res) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`);
        return {
            success: false,
            message: 'Too many authentication attempts from this IP, please try again after 15 minutes.',
        };
    },
    handler: (req, res, next, options) => {
        res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true,
    legacyHeaders: false,
});
```