```javascript
// tests/__mocks__/redis.js
// Mock Redis client for unit and integration tests

const mockRedisClient = {
  isReady: false, // Start as not ready
  on: jest.fn((event, callback) => {
    if (event === 'connect') {
      // Simulate connection after a short delay
      setTimeout(() => {
        mockRedisClient.isReady = true;
        callback();
      }, 10);
    }
  }),
  connect: jest.fn(async () => {
    mockRedisClient.isReady = true;
    return Promise.resolve();
  }),
  disconnect: jest.fn(async () => {
    mockRedisClient.isReady = false;
    return Promise.resolve();
  }),
  quit: jest.fn(async () => {
    mockRedisClient.isReady = false;
    return Promise.resolve();
  }),
  get: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(),
};

module.exports = mockRedisClient;
```