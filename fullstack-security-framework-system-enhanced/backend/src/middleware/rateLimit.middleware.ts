import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'express-rate-limit-redis';
import { redisClient } from '@config/redis';
import { env } from '@config/env';
import { GenericMessages } from '@constants/messages';
import httpStatus from 'http-status';

// Rate limiting middleware
export const apiRateLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs, // e.g., 1 minute
  max: env.rateLimitMaxRequests, // e.g., 100 requests per windowMs
  message: {
    message: GenericMessages.RATE_LIMIT_EXCEEDED,
    code: httpStatus.TOO_MANY_REQUESTS,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    // Or, for Redis v4+ use:
    // client: redisClient,
  }),
});

// Optionally, specific rate limiters for auth routes
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Max 50 requests per 15 minutes per IP
  message: {
    message: GenericMessages.RATE_LIMIT_EXCEEDED,
    code: httpStatus.TOO_MANY_REQUESTS,
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});