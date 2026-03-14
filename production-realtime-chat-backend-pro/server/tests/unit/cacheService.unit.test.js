```javascript
const cacheService = require('../../services/cacheService');
const redisClient = require('../../config/redis');
const logger = require('../../config/winston');

// Mock Redis client methods
jest.mock('../../config/redis', () => ({
  hSet: jest.fn(),
  hDel: jest.fn(),
  hGetAll: jest.fn(),
  setEx: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  on: jest.fn(), // Mock for the event listeners
  connect: jest.fn().mockResolvedValue(true), // Mock connect method
  quit: jest.fn().mockResolvedValue(true),
}));

// Mock logger to prevent actual logging during tests
logger.error = jest.fn();
logger.warn = jest.fn();
logger.info = jest.fn();
logger.debug = jest.fn();

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- addOnlineUser tests ---
  describe('addOnlineUser', () => {
    it('should call redisClient.hSet to add an online user', async () => {
      await cacheService.addOnlineUser('user1', 'Alice');
      expect(redisClient.hSet).toHaveBeenCalledWith('online_users', 'user1', 'Alice');
      expect(logger.debug).toHaveBeenCalledWith('User Alice (user1) added to online cache.');
    });

    it('should log an error if redisClient.hSet fails', async () => {
      const error = new Error('Redis hSet failed');
      redisClient.hSet.mockRejectedValue(error);
      await cacheService.addOnlineUser('user1', 'Alice');
      expect(logger.error).toHaveBeenCalledWith('Error adding online user to cache: Redis hSet failed');
    });
  });

  // --- removeOnlineUser tests ---
  describe('removeOnlineUser', () => {
    it('should call redisClient.hDel to remove an online user', async () => {
      await cacheService.removeOnlineUser('user1');
      expect(redisClient.hDel).toHaveBeenCalledWith('online_users', 'user1');
      expect(logger.debug).toHaveBeenCalledWith('User user1 removed from online cache.');
    });

    it('should log an error if redisClient.hDel fails', async () => {
      const error = new Error('Redis hDel failed');
      redisClient.hDel.mockRejectedValue(error);
      await cacheService.removeOnlineUser('user1');
      expect(logger.error).toHaveBeenCalledWith('Error removing online user from cache: Redis hDel failed');
    });
  });

  // --- getOnlineUsers tests ---
  describe('getOnlineUsers', () => {
    it('should call redisClient.hGetAll and return online users', async () => {
      redisClient.hGetAll.mockResolvedValue({ user1: 'Alice', user2: 'Bob' });
      const users = await cacheService.getOnlineUsers();
      expect(redisClient.hGetAll).toHaveBeenCalledWith('online_users');
      expect(users).toEqual({ user1: 'Alice', user2: 'Bob' });
      expect(logger.debug).toHaveBeenCalledWith('Fetched all online users from cache.');
    });

    it('should log an error and return empty object if redisClient.hGetAll fails', async () => {
      const error = new Error('Redis hGetAll failed');
      redisClient.hGetAll.mockRejectedValue(error);
      const users = await cacheService.getOnlineUsers();
      expect(logger.error).toHaveBeenCalledWith('Error fetching online users from cache: Redis hGetAll failed');
      expect(users).toEqual({});
    });
  });

  // --- setCachedRecentMessages tests ---
  describe('setCachedRecentMessages', () => {
    it('should call redisClient.setEx to cache recent messages', async () => {
      const messages = [{ id: 'm1', content: 'test' }];
      await cacheService.setCachedRecentMessages('room1', messages);
      expect(redisClient.setEx).toHaveBeenCalledWith('recent_messages:room1', expect.any(Number), JSON.stringify(messages));
      expect(logger.debug).toHaveBeenCalledWith('Cached recent messages for room room1.');
    });

    it('should log an error if redisClient.setEx fails', async () => {
      const error = new Error('Redis setEx failed');
      redisClient.setEx.mockRejectedValue(error);
      await cacheService.setCachedRecentMessages('room1', []);
      expect(logger.error).toHaveBeenCalledWith('Error setting cached recent messages for room room1: Redis setEx failed');
    });
  });

  // --- getCachedRecentMessages tests ---
  describe('getCachedRecentMessages', () => {
    it('should call redisClient.get and return parsed messages if cached', async () => {
      const messages = [{ id: 'm1', content: 'test' }];
      redisClient.get.mockResolvedValue(JSON.stringify(messages));
      const cached = await cacheService.getCachedRecentMessages('room1');
      expect(redisClient.get).toHaveBeenCalledWith('recent_messages:room1');
      expect(cached).toEqual(messages);
      expect(logger.debug).toHaveBeenCalledWith('Retrieved cached recent messages for room room1.');
    });

    it('should return null if no messages are cached', async () => {
      redisClient.get.mockResolvedValue(null);
      const cached = await cacheService.getCachedRecentMessages('room1');
      expect(cached).toBeNull();
    });

    it('should log an error and return null if redisClient.get fails', async () => {
      const error = new Error('Redis get failed');
      redisClient.get.mockRejectedValue(error);
      const cached = await cacheService.getCachedRecentMessages('room1');
      expect(logger.error).toHaveBeenCalledWith('Error getting cached recent messages for room room1: Redis get failed');
      expect(cached).toBeNull();
    });
  });

  // --- invalidateRecentMessages tests ---
  describe('invalidateRecentMessages', () => {
    it('should call redisClient.del to invalidate messages cache', async () => {
      await cacheService.invalidateRecentMessages('room1');
      expect(redisClient.del).toHaveBeenCalledWith('recent_messages:room1');
      expect(logger.debug).toHaveBeenCalledWith('Invalidated recent messages cache for room room1.');
    });

    it('should log an error if redisClient.del fails', async () => {
      const error = new Error('Redis del failed');
      redisClient.del.mockRejectedValue(error);
      await cacheService.invalidateRecentMessages('room1');
      expect(logger.error).toHaveBeenCalledWith('Error invalidating recent messages cache for room room1: Redis del failed');
    });
  });
});
```