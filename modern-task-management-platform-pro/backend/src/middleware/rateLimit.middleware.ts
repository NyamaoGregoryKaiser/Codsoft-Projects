```typescript
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis';
import { AppError } from '../utils/errors';

// Extend the Request type to include `rateLimit` property
declare global {
  namespace Express {
    interface Request {
      rateLimit?: {
        limit: number;
        current: number;
        remaining: number;
        resetTime?: Date;
      };
    }
  }
}

// Global API rate limiter for all requests
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  store: new RedisStore({
    // @ts-ignore: `call` method expected in `client`
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError('Too many requests from this IP, please try again after some time.', 429));
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes
export const authRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: 'Too many authentication attempts from this IP, please try again after an hour',
  store: new RedisStore({
    // @ts-ignore: `call` method expected in `client`
    client: redisClient,
    prefix: 'auth-rate-limit:',
  }),
  handler: (req: Request, res: Response, next: NextFunction) => {
    next(new AppError('Too many authentication attempts from this IP, please try again after an hour.', 429));
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```