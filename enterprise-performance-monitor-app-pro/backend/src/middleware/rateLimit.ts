import rateLimit from 'express-rate-limit';
import { env } from '../config/env';
import { Logger } from '../config/winston';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: env.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 1 minute',
  handler: (req, res, next, options) => {
    Logger.warn(`Rate limit exceeded for IP: ${req.ip} on ${req.method} ${req.originalUrl}`);
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export const performanceDataRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: env.PERF_DATA_RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 1000 requests per windowMs for performance data
  message: 'Too many performance data requests from this IP, please try again after 1 minute',
  handler: (req, res, next, options) => {
    Logger.warn(`Performance data rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
  keyGenerator: (req) => {
    // Use X-API-KEY as part of the key to rate limit per application, not just per IP
    return req.headers['x-api-key'] ? `${req.ip}-${req.headers['x-api-key']}` : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
});