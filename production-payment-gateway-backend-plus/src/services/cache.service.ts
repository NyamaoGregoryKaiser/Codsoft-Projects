```typescript
import { createClient, RedisClientType } from "redis";
import config from "../config";
import logger from "../config/logger";

let redisClient: RedisClientType | null = null;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: `redis://${config.REDIS_HOST}:${config.REDIS_PORT}`,
    });

    redisClient.on("error", (err) => logger.error("Redis Client Error", err));

    await redisClient.connect();
    logger.info("Connected to Redis successfully!");
  } catch (error) {
    logger.error("Failed to connect to Redis:", error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient || !redisClient.isReady) {
    throw new Error("Redis client not initialized or not connected.");
  }
  return redisClient;
};

export const setCache = async (key: string, value: string | object, expiresInSeconds = 3600): Promise<void> => {
  if (!redisClient) {
    logger.warn("Redis client not available for setCache operation.");
    return;
  }
  const serializedValue = typeof value === "object" ? JSON.stringify(value) : value;
  await redisClient.setEx(key, expiresInSeconds, serializedValue);
  logger.debug(`Cached key: ${key}`);
};

export const getCache = async (key: string): Promise<string | null> => {
  if (!redisClient) {
    logger.warn("Redis client not available for getCache operation.");
    return null;
  }
  const data = await redisClient.get(key);
  logger.debug(`Retrieved key: ${key}`);
  return data;
};

export const deleteCache = async (key: string): Promise<void> => {
  if (!redisClient) {
    logger.warn("Redis client not available for deleteCache operation.");
    return;
  }
  await redisClient.del(key);
  logger.debug(`Deleted key: ${key}`);
};
```