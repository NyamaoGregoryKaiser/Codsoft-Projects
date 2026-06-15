import { createClient, RedisClientType } from 'redis';
import config from '../config';
import logger from '../utils/logger';

let redisClient: RedisClientType | null = null;

const connectRedis = async () => {
  if (redisClient) {
    return redisClient;
  }
  try {
    redisClient = createClient({
      url: config.redisUrl,
    });
    redisClient.on('error', (err) => logger.error('Redis Client Error', err));
    redisClient.on('connect', () => logger.info('Redis Client Connected'));
    await redisClient.connect();
    logger.info('Connected to Redis');
    return redisClient;
  } catch (error) {
    logger.error('Could not connect to Redis', error);
    redisClient = null; // Reset client on failure
    throw error;
  }
};

const getCache = async (key: string) => {
  if (!redisClient) {
    await connectRedis(); // Attempt to reconnect if not connected
    if (!redisClient) return null; // If still not connected, return null
  }
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.error(`Error getting cache for key ${key}:`, error);
    return null;
  }
};

const setCache = async (key: string, value: any, expiresInSeconds: number = 3600) => {
  if (!redisClient) {
    await connectRedis();
    if (!redisClient) return;
  }
  try {
    await redisClient.set(key, JSON.stringify(value), { EX: expiresInSeconds });
  } catch (error) {
    logger.error(`Error setting cache for key ${key}:`, error);
  }
};

const deleteCache = async (key: string) => {
  if (!redisClient) {
    await connectRedis();
    if (!redisClient) return;
  }
  try {
    await redisClient.del(key);
  } catch (error) {
    logger.error(`Error deleting cache for key ${key}:`, error);
  }
};

export { connectRedis, getCache, setCache, deleteCache };
```