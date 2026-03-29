```typescript
import { rateLimit } from 'express-rate-limit';
import logger from '../utils/logger';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  message: 'Too many requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}. URL: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
});

// Specific rate limit for login attempts to prevent brute-force
export const loginRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 login attempts per 5 minutes per IP
  message: 'Too many login attempts from this IP, please try again after 5 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Login rate limit exceeded for IP: ${req.ip}. Email: ${req.body.email}`);
    res.status(options.statusCode).send(options.message);
  },
});
```