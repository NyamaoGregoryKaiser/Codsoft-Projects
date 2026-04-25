```typescript
import { createClient } from 'redis';
import * as dotenv from 'dotenv';
import path from 'path';
import { logger } from './logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let redisClient: ReturnType<typeof createClient>;

export const connectRedis = async () => {
  const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
  const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

  redisClient = createClient({
    url: `redis://${REDIS_HOST}:${REDIS_PORT}`,
    socket: {
      connectTimeout: 10000, // 10 seconds timeout for connection
    },
  });

  redisClient.on('error', (err) => logger.error('Redis Client Error', err));
  redisClient.on('connect', () => logger.info('Redis Client Connected'));
  redisClient.on('reconnecting', () => logger.warn('Redis Client Reconnecting'));
  redisClient.on('end', () => logger.info('Redis Client Disconnected'));

  try {
    await redisClient.connect();
    logger.info(`Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
  } catch (error) {
    logger.error(`Could not connect to Redis at ${REDIS_HOST}:${REDIS_PORT}:`, error);
    throw error; // Re-throw to indicate a critical startup failure
  }
};

export const getRedisClient = () => {
  if (!redisClient || !redisClient.isReady) {
    // In a production environment, you might want to handle this more gracefully,
    // e.g., fall back to no caching or retry connection.
    // For this example, we assume `connectRedis` is called at startup.
    logger.warn('Redis client not ready. Returning uninitialized client. Operations may fail.');
    // Attempt to connect if not connected
    if (!redisClient) {
        // This is a defensive check, connectRedis should be called once at startup.
        // If called here, it would mean `getRedisClient` was called before `connectRedis`
        // or after `destroy`.
        logger.error('Redis client was not initialized. Attempting re-initialization might be needed.');
        // If you want auto-reconnect, this is where you'd implement it,
        // but it can be problematic with connection lifecycle.
        // For simplicity, we expect it to be ready from initial server start.
    }
  }
  return redisClient;
};
```