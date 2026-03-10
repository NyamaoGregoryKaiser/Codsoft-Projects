import { createClient } from 'redis';
import { env } from './env';
import { logger } from '@utils/logger';

export const redisClient = createClient({
  socket: {
    host: env.redisHost,
    port: env.redisPort,
  },
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));

// Optional: Graceful shutdown of Redis client
process.on('SIGINT', async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected due to app termination');
  }
});
process.on('SIGTERM', async () => {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected due to app termination');
  }
});