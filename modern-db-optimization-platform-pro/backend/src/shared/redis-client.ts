```typescript
import { createClient } from 'redis';
import { config } from '../config';
import logger from './logger';

const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
  password: config.redis.password,
});

redisClient.on('connect', () => logger.info('Redis client connected'));
redisClient.on('ready', () => logger.info('Redis client ready to use'));
redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.on('end', () => logger.info('Redis client disconnected'));

export async function connectRedis(): Promise<void> {
  if (!redisClient.isReady) {
    await redisClient.connect();
  }
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient.isReady) {
    await redisClient.quit();
  }
}

export default redisClient;
```