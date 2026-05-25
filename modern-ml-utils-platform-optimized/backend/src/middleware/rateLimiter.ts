import rateLimit from 'express-rate-limit';
import config from '../config';
import httpStatus from 'http-status';

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, // 1 minute
  max: config.rateLimit.maxRequests, // Limit each IP to 100 requests per `window` (here, per 1 minute)
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  statusCode: httpStatus.TOO_MANY_REQUESTS,
});

export default authLimiter;