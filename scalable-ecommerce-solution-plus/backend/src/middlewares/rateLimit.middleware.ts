import { rateLimit } from 'express-rate-limit';
import config from '../config';
import logger from '../config/logger';

const apiLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs, // e.g., 1 minute
    max: config.rateLimitMax, // e.g., 100 requests per window
    message: 'Too many requests from this IP, please try again after some time.',
    handler: (req, res, next, options) => {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}. ${options.message}`);
        res.status(options.statusCode).send({ message: options.message });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export default apiLimiter;