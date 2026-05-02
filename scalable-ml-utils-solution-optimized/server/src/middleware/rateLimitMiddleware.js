const rateLimit = require('express-rate-limit');
const { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX } = require('../config');
const AppError = require('../utils/appError');

// General API rate limiter
exports.apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS, // 1 minute
  max: RATE_LIMIT_MAX, // Max requests per windowMs
  message: new AppError('Too many requests from this IP, please try again after a minute', 429),
  headers: true, // Include X-RateLimit-* headers
});

// Specific limiter for login attempts (can be more restrictive)
exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  message: new AppError(
    'Too many login attempts from this IP, please try again after 15 minutes',
    429
  ),
  headers: true,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});