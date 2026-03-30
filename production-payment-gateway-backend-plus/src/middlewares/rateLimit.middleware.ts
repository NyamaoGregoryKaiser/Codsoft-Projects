```typescript
import rateLimit from "express-rate-limit";
import config from "../config";
import logger from "../config/logger";

export const setupRateLimit = () => {
  const limiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS, // e.g., 1 minute
    max: config.RATE_LIMIT_MAX_REQUESTS, // e.g., limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again after some time.",
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).send(options.message);
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  logger.info(`Rate limiting configured: ${config.RATE_LIMIT_MAX_REQUESTS} requests per ${config.RATE_LIMIT_WINDOW_MS / 1000} seconds.`);
  return limiter;
};
```