import Redis from 'ioredis';
import logger from '../utils/logger';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

const redisClient = new Redis({
  host: redisHost,
  port: redisPort,
  maxRetriesPerRequest: null, // Allow infinite retries
  enableReadyCheck: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000); // Exponential backoff up to 2 seconds
    logger.warn(`Redis: Attempting to reconnect (attempt ${times}), retrying in ${delay}ms...`);
    return delay;
  },
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('error', (err) => logger.error('Redis Client Error:', err));
redisClient.on('reconnecting', (delay) => logger.warn(`Redis client reconnecting... delay: ${delay}`));
redisClient.on('end', () => logger.info('Redis client connection closed'));

export default redisClient;