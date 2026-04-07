```typescript
import { rateLimit } from 'express-rate-limit';
import { ApiError } from './errorHandler';
import ApiResponse from '../lib/ApiResponse';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per 15 minutes per IP
  message: (req, res) => {
    res.status(429).json(ApiResponse.error('Too many requests, please try again after 15 minutes.', 'Rate Limit Exceeded', 429));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // Max 1000 requests per hour per IP for general API
  message: (req, res) => {
    res.status(429).json(ApiResponse.error('Too many requests, please try again after an hour.', 'Rate Limit Exceeded', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```