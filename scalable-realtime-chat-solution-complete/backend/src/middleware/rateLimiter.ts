```typescript
import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../config/logger';

export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.rateLimitMaxRequests, // Max requests per window per IP
  message: 'Too many requests from this IP, please try again after 1 minute.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});
```