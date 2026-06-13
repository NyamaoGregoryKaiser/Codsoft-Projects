```typescript
import { Request, Response, NextFunction } from 'express';
import { APIError } from '../utils/error';
import logger from '../utils/logger';

// In-memory store for tracking request counts by IP
const requestCounts = new Map<string, { count: number; lastReset: number }>();

const MAX_REQUESTS = 100; // Max requests allowed
const WINDOW_MS = 60 * 1000; // Time window in milliseconds (1 minute)

export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip; // Get IP address

  if (!ip) {
    logger.warn('Rate Limit: Could not determine IP address for request.');
    return next(new APIError('Unable to determine IP address for rate limiting', 400));
  }

  const now = Date.now();
  let ipData = requestCounts.get(ip);

  if (!ipData || (now - ipData.lastReset) > WINDOW_MS) {
    // Initialize or reset count for this IP
    ipData = { count: 0, lastReset: now };
    requestCounts.set(ip, ipData);
  }

  ipData.count++;

  if (ipData.count > MAX_REQUESTS) {
    logger.warn(`Rate Limit Exceeded: IP ${ip} exceeded ${MAX_REQUESTS} requests within ${WINDOW_MS / 1000} seconds.`);
    res.setHeader('Retry-After', Math.ceil((ipData.lastReset + WINDOW_MS - now) / 1000));
    return next(new APIError('Too many requests, please try again later.', 429));
  }

  // Update headers for client feedback (optional)
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - ipData.count));
  res.setHeader('X-RateLimit-Reset', Math.ceil((ipData.lastReset + WINDOW_MS) / 1000));

  next();
};

// Clean up expired entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  requestCounts.forEach((ipData, ip) => {
    if (now - ipData.lastReset > WINDOW_MS * 2) { // Remove entries twice the window duration old
      requestCounts.delete(ip);
      logger.debug(`Rate Limit: Cleaned up expired IP entry for ${ip}`);
    }
  });
}, WINDOW_MS); // Run cleanup every window duration
```