```typescript
import Redis from 'ioredis';
import { config } from './config';
import logger from '../utils/logger';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  lazyConnect: true, // Connect on first command
});

redisClient.on('connect', () => {
  logger.info('Redis client connected!');
});

redisClient.on('error', (err) => {
  logger.error('Redis client error:', err);
  // Optionally, you might want to gracefully handle Redis connection issues
  // e.g., switch to a fallback caching mechanism or disable caching temporarily.
});

// Connect to Redis proactively on server startup, but allow lazyConnect for resilience
export const initializeRedis = async () => {
  try {
    await redisClient.connect();
    logger.info('Redis connection established.');
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    // Continue without Redis if it's not critical, or exit if it is.
    // For this app, caching is optional, so we'll just log and continue.
  }
};
```