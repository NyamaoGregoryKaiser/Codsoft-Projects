```typescript
import logger from './logger';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

/**
 * Simple in-memory cache utility.
 * Not suitable for multi-instance deployments without a distributed cache like Redis.
 */
export class Cache {
  private cache = new Map<string, CacheEntry<any>>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(public name: string, private ttlSeconds: number = 300) { // Default TTL: 5 minutes
    logger.info(`Cache '${name}' initialized with TTL: ${ttlSeconds} seconds.`);
    this.startCleanupTimer();
  }

  /**
   * Retrieves an item from the cache.
   * @param key The cache key.
   * @returns The cached item if valid, otherwise undefined.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() > entry.expiry) {
      this.delete(key); // Remove expired item
      logger.debug(`Cache '${this.name}': Expired item for key '${key}' removed.`);
      return undefined;
    }

    return entry.value as T;
  }

  /**
   * Stores an item in the cache.
   * @param key The cache key.
   * @param value The item to store.
   * @param customTtlSeconds Optional custom TTL for this item.
   */
  set<T>(key: string, value: T, customTtlSeconds?: number): void {
    const expiry = Date.now() + (customTtlSeconds !== undefined ? customTtlSeconds : this.ttlSeconds) * 1000;
    this.cache.set(key, { value, expiry });
    logger.debug(`Cache '${this.name}': Item set for key '${key}' (expires in ${Math.round((expiry - Date.now()) / 1000)}s).`);
  }

  /**
   * Deletes an item from the cache.
   * @param key The cache key.
   */
  delete(key: string): boolean {
    logger.debug(`Cache '${this.name}': Item for key '${key}' deleted.`);
    return this.cache.delete(key);
  }

  /**
   * Clears all items from the cache.
   */
  clearAll(): void {
    this.cache.clear();
    logger.info(`Cache '${this.name}': All items cleared.`);
  }

  /**
   * Gets the number of items currently in the cache.
   * @returns The size of the cache.
   */
  size(): number {
    return this.cache.size;
  }

  private startCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    // Periodically clean up expired entries
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleanedCount = 0;
      this.cache.forEach((entry, key) => {
        if (now > entry.expiry) {
          this.cache.delete(key);
          cleanedCount++;
        }
      });
      if (cleanedCount > 0) {
        logger.debug(`Cache '${this.name}': Cleaned up ${cleanedCount} expired items.`);
      }
    }, this.ttlSeconds * 1000 / 2); // Run cleanup roughly halfway through the TTL
  }

  /**
   * Stops the automatic cleanup timer.
   */
  stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info(`Cache '${this.name}': Cleanup timer stopped.`);
    }
  }
}
```