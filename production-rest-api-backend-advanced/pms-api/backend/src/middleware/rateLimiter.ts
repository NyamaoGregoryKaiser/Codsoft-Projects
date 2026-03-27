import rateLimit from 'express-rate-limit';
import config from '../config';
import { ApiError } from '../utils/apiError';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Max requests per windowMs per IP
  message: new ApiError(429, 'Too many requests, please try again after a minute.'),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // draft-6: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
  // draft-7: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
});