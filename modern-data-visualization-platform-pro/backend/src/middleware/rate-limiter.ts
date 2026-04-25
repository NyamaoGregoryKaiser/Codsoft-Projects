import { rateLimit } from 'express-rate-limit';
import logger from '@config/logger';

/**
 * Global API rate limiter middleware.
 * Limits each IP address to `max` requests per `windowMs`.
 * Uses Redis store for distributed rate limiting if configured.
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}. URL: ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
  // If Redis is configured, use it for a distributed store
  // Requires installing `rate-limit-redis` package
  // store: new RedisStore({
  //   sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  // }),
});