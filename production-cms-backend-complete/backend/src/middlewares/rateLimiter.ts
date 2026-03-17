import rateLimit from 'express-rate-limit';
import { CustomError } from './errorHandler';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15', 10) * 60 * 1000; // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // max 100 requests per 15 minutes

export const apiRateLimiter = rateLimit({
  windowMs: windowMs,
  max: maxRequests,
  message: new CustomError(429, 'Too many requests from this IP, please try again after 15 minutes.').message,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      message: options.message,
    });
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});