import { rateLimit } from 'express-rate-limit';
import config from '../config/env';
import { ReasonPhrases, StatusCodes } from 'http-status-codes';

const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 1 minute
  max: config.RATE_LIMIT_MAX_REQUESTS, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json({
      success: false,
      error: {
        code: ReasonPhrases.TOO_MANY_REQUESTS,
        message: options.message,
      },
    });
  },
});

export default limiter;