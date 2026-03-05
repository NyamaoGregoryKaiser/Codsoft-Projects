const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');
const config = require('../config/config');

const rateLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs, // 1 minute
  max: config.rateLimitMax, // Max 100 requests per 1 minute per IP
  message: new AppError('Too many requests from this IP, please try again after an hour!', 429),
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = { rateLimiter };