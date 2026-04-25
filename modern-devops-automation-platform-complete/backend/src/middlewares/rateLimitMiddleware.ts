```typescript
import { rateLimit } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests

export const rateLimitMiddleware = rateLimit({
  windowMs: windowMs,
  max: maxRequests,
  message: {
    status: StatusCodes.TOO_MANY_REQUESTS,
    message: 'Too many requests from this IP, please try again after some time.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // You can customize the key generator or store if needed
  // store: new RedisStore({
  //   sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  // }),
});
```