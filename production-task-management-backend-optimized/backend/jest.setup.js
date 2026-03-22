```javascript
// Global setup for Jest tests
// For example, if you need to mock external services or define global variables

// Mock logger to prevent actual logging during tests
jest.mock('./src/middlewares/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

// Mock redis client to prevent actual redis calls during tests
jest.mock('./src/utils/redisClient', () => ({
  get: jest.fn(),
  setEx: jest.fn(),
  keys: jest.fn(() => Promise.resolve([])),
  del: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
}));

// Mock local cache client
jest.mock('./src/utils/localCache', () => ({
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
  has: jest.fn(),
}));

// Mock Prisma for service layer tests to isolate DB interactions
// For API tests, we will use a test database
// This setup specifically mocks the _instance_ of Prisma, not the module itself
// For example, in service tests, you might want to mock individual prisma methods.
// Here, we just ensure it's available without connecting to a real DB for non-API tests.
jest.mock('./src/db/prisma', () => {
  const { PrismaClient } = require('@prisma/client');
  const mockPrisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://mockuser:mockpass@localhost:5432/mockdb?schema=public',
      },
    },
  });
  // Mock common methods
  mockPrisma.user = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  mockPrisma.project = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  mockPrisma.task = {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
  };
  mockPrisma.$connect = jest.fn(() => Promise.resolve());
  mockPrisma.$disconnect = jest.fn(() => Promise.resolve());
  mockPrisma.$on = jest.fn(); // Mock event listener
  return mockPrisma;
});

// Mock environment variables for consistent testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'testsecret';
process.env.JWT_EXPIRES_IN = '1h';
process.env.RATE_LIMIT_WINDOW_MS = '1000'; // 1 second
process.env.RATE_LIMIT_MAX_REQUESTS = '5'; // 5 requests
```