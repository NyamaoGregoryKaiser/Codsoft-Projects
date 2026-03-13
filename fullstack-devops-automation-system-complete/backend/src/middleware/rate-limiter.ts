```typescript
import { rateLimit } from 'express-rate-limit';
import logger from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit hit for IP: ${req.ip} on route ${req.originalUrl}`);
    res.status(options.statusCode).send({ message: options.message });
  },
});

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Allow 5 failed login attempts per IP within 15 minutes
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP address as the key for rate limiting
    return req.ip;
  },
  handler: (req, res, next, options) => {
    logger.warn(`Login rate limit hit for IP: ${req.ip} on route ${req.originalUrl}`);
    res.status(options.statusCode).send({ message: options.message });
  },
});
```