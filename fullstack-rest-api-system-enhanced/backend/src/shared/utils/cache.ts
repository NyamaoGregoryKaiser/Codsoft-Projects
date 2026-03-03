import { createClient, RedisClientType } from 'redis';
import { config } from '../../config';
import { logger } from '../../config/logger';
import { CacheClient, CacheOptions } from '../interfaces/Cache.interface';

class RedisCacheClient implements CacheClient {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: `redis://${config.redis.host}:${config.redis.port}`,
    });

    this.client.on('error', (err) => logger.error('Redis Client Error', err));
    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis client connected');
    });
    this.client.on('end', () => {
      this.isConnected = false;
      logger.info('Redis client disconnected');
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.quit(); // Use quit to ensure all pending commands are sent
    }
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache GET for key:', key);
        return null;
    }
    return this.client.get(key);
  }

  async set(key: string, value: string, options?: CacheOptions): Promise<string | null> {
    if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache SET for key:', key);
        return null;
    }
    if (options?.EX) {
      return this.client.set(key, value, { EX: options.EX });
    }
    return this.client.set(key, value);
  }

  async del(key: string | string[]): Promise<number> {
    if (!this.isConnected) {
        logger.warn('Redis not connected, skipping cache DEL for key(s):', key);
        return 0;
    }
    if (Array.isArray(key)) {
        // Use DEL command for multiple keys
        return this.client.del(key);
    } else if (key.includes('*')) {
        // For pattern deletion, use SCAN and DEL
        const keysToDelete: string[] = [];
        let cursor = 0;
        do {
            const reply = await this.client.scan(cursor, { MATCH: key, COUNT: 100 });
            cursor = reply.cursor;
            keysToDelete.push(...reply.keys);
        } while (cursor !== 0);

        if (keysToDelete.length > 0) {
            return this.client.del(keysToDelete);
        }
        return 0;
    }
    return this.client.del(key);
  }
}

export const redisClient = new RedisCacheClient();