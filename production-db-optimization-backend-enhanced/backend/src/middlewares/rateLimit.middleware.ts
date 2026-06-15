import rateLimit from 'express-rate-limit';
import config from '../config';
import { ApiError } from './error.middleware';

const apiLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.rateLimitMaxRequests, // Max requests per windowMs
  message: new ApiError(429, 'Too many requests, please try again after a minute.').message,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export default apiLimiter;
```