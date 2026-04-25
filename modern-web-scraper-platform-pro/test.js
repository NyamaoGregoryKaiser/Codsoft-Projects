// backend/src/middleware/rateLimit.middleware.js
    const rateLimit = require('express-rate-limit');
    const logger = require('../services/logger.service');

    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // Max 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again after some time.',
      },
      headers: true, // Send X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset headers
      keyGenerator: (req, res) => {
        // Use IP address as the key for rate limiting
        return req.ip;
      },
      handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on URL: ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
      },
      // Skip rate limiting for specific routes if needed (e.g., /status)
      // skip: (req, res) => req.url.startsWith('/api/v1/status'),
    });

    module.exports = limiter;