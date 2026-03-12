```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Global API rate limiter.
 * Limits each IP to 100 requests per 15 minutes.
 */
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again after 15 minutes',
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});

/**
 * Stricter rate limiter for authentication routes.
 * Limits each IP to 10 requests per 5 minutes.
 */
const authRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 requests per `windowMs`
  message: 'Too many authentication attempts from this IP, please try again after 5 minutes',
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});

/**
 * Rate limiter for metric collection endpoint.
 * Allows more frequent requests for metric collection.
 * Example: 600 requests per minute (10 requests per second average).
 */
const metricRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600, // Limit each IP to 600 requests per minute
  message: 'Too many metric collection requests from this IP. Please ensure your application sends metrics within reasonable limits.',
  handler: (req, res, next, options) => {
    logger.warn(`Metric rate limit exceeded for API Key: ${req.headers['x-api-key']} on path: ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});


module.exports = {
  apiRateLimiter,
  authRateLimiter,
  metricRateLimiter,
};
```