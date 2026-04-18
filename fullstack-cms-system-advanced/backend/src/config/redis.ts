import { Redis } from 'ioredis';
import { config } from './index';
import logger from './logger';

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  lazyConnect: true, // Only connect when a command is issued
});

redisClient.on('connect', () => logger.info('Redis client connected!'));
redisClient.on('error', (err) => logger.error('Redis Client Error', err));

// Function to set cache with a default TTL
export const setCache = async (key: string, value: any, ttlSeconds: number = config.redis.ttl): Promise<void> => {
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (error) {
    logger.error(`Failed to set cache for key ${key}:`, error);
  }
};

// Function to get cache
export const getCache = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Failed to get cache for key ${key}:`, error);
    return null;
  }
};

// Function to delete cache
export const deleteCache = async (key: string): Promise<void> => {
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Failed to delete cache for key ${key}:`, error);
  }
};

export default redisClient;