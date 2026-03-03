const rateLimit = require('express-rate-limit');
const httpStatus = require('http-status');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 requests per 15 minutes
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: httpStatus.TOO_MANY_REQUESTS,
});

module.exports = {
  authLimiter,
};