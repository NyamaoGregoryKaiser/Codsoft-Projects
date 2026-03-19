```javascript
const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Define a general API rate limiter
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    },
});

// Optionally, define a stricter limiter for specific routes like login/signup
exports.authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5, // Limit each IP to 5 login/signup requests per windowMs
    message: 'Too many authentication attempts from this IP, please try again after 5 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`Auth rate limit exceeded for IP: ${req.ip} on route: ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    },
});
```