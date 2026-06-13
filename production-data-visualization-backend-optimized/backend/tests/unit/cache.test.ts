```typescript
import { Cache } from '../../src/utils/cache';
import logger from '../../src/utils/logger';

// Mock logger to prevent actual console output during tests
jest.mock('../../src/utils/logger');

describe('Cache', () => {
  let cache: Cache;
  const cacheName = 'testCache';
  const defaultTtl = 1; // 1 second for faster testing

  beforeEach(() => {
    jest.useFakeTimers(); // Control time with Jest
    cache = new Cache(cacheName, defaultTtl);
  });

  afterEach(() => {
    cache.stopCleanupTimer(); // Stop the interval to prevent memory leaks in tests
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should set and get an item from the cache', () => {
    const key = 'testKey';
    const value = { data: 'some data' };
    cache.set(key, value);
    expect(cache.get(key)).toEqual(value);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`Item set for key '${key}'`));
  });

  it('should return undefined for a non-existent key', () => {
    expect(cache.get('nonExistentKey')).toBeUndefined();
  });

  it('should return undefined for an expired key', () => {
    const key = 'expiredKey';
    const value = 'expiredValue';
    cache.set(key, value, 0.1); // Set a very short TTL (0.1 seconds)

    jest.advanceTimersByTime(150); // Advance time past expiry
    expect(cache.get(key)).toBeUndefined();
    expect(cache.size()).toBe(0); // Should be removed upon access
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`Expired item for key '${key}' removed.`));
  });

  it('should delete a specific item from the cache', () => {
    const key1 = 'key1';
    const key2 = 'key2';
    cache.set(key1, 'value1');
    cache.set(key2, 'value2');

    expect(cache.delete(key1)).toBe(true);
    expect(cache.get(key1)).toBeUndefined();
    expect(cache.get(key2)).toBe('value2');
    expect(cache.size()).toBe(1);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`Item for key '${key1}' deleted.`));
  });

  it('should clear all items from the cache', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);

    cache.clearAll();
    expect(cache.size()).toBe(0);
    expect(cache.get('key1')).toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(`All items cleared.`));
  });

  it('should correctly report cache size', () => {
    expect(cache.size()).toBe(0);
    cache.set('key1', 'value1');
    expect(cache.size()).toBe(1);
    cache.set('key2', 'value2');
    expect(cache.size()).toBe(2);
    cache.delete('key1');
    expect(cache.size()).toBe(1);
  });

  it('should use custom TTL when provided', () => {
    const key = 'customTtlKey';
    const value = 'customValue';
    cache.set(key, value, 0.5); // 0.5 seconds TTL

    jest.advanceTimersByTime(200); // 0.2s, before expiry
    expect(cache.get(key)).toBe(value);

    jest.advanceTimersByTime(400); // Total 0.6s, after expiry
    expect(cache.get(key)).toBeUndefined();
  });

  it('should clean up expired items automatically via timer', () => {
    cache = new Cache(cacheName, 0.1); // Short TTL for quick cleanup
    const key1 = 'item1';
    const key2 = 'item2';
    cache.set(key1, 'value1');
    cache.set(key2, 'value2', 0.05); // Shorter TTL for key2

    jest.advanceTimersByTime(70); // key2 should expire

    expect(cache.size()).toBe(2); // Cleanup timer hasn't run yet, but get would clear key2
    cache.get(key1); // Access key1 to keep it active
    cache.get(key2); // Access key2, it should be expired and removed by get
    expect(cache.size()).toBe(1); // key1 remains

    jest.advanceTimersByTime(100); // Advance enough for the cleanup interval to run and key1 to expire
    // For automatic cleanup, we need to manually trigger the interval
    jest.runOnlyPendingTimers();

    expect(cache.size()).toBe(0);
    expect(logger.debug).toHaveBeenCalledWith(expect.stringContaining(`Cleaned up 1 expired items.`));
  });
});
```