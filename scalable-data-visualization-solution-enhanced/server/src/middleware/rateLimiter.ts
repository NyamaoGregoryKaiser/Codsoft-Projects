```typescript
import { rateLimit } from 'express-rate-limit';
import { config } from '../config/config';
import { logger } from '../utils/logger';

export const apiRateLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW * 1000, // seconds -> milliseconds
  max: config.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to max requests per windowMs
  message: {
    message: `Too many requests from this IP, please try again after ${config.RATE_LIMIT_WINDOW} seconds.`,
    statusCode: 429,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});
```