import rateLimit from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests

export const apiRateLimiter = rateLimit({
  windowMs: windowMs,
  max: maxRequests,
  message: {
    status: 'error',
    message: `Too many requests from this IP, please try again after ${windowMs / 1000} seconds.`,
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).send(options.message);
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (15 minutes)
  message: {
    status: 'error',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip} for endpoint ${req.path}`);
    res.status(options.statusCode).send(options.message);
  },
});