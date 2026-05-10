import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../database/redis-client';
import { AppError } from '../error';
import dotenv from 'dotenv';

dotenv.config();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests per minute

export const apiRateLimiter = rateLimit({
  windowMs: WINDOW_MS,
  max: MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  handler: (req, res, next, options) => {
    next(new AppError(`Too many requests from this IP, please try again after ${Math.ceil(options.windowMs / 1000 / 60)} minute(s)`, 429));
  },
  keyGenerator: (req) => req.ip || 'unknown', // Use IP address as the key
});