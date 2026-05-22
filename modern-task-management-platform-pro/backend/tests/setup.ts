```typescript
import { AppDataSource } from '../src/database/data-source';
import { config } from '../src/config/config';
import logger from '../src/utils/logger';
import { Redis } from 'ioredis'; // Import Redis type

// Mock Redis client for tests
const mockRedisClient = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(() => Promise.resolve([])),
  on: jest.fn(),
  connect: jest.fn(),
  isReady: true,
} as unknown as Redis; // Cast to Redis type

// Dynamically replace the real redisClient with the mock
jest.mock('../src/config/redis', () => ({
  redisClient: mockRedisClient,
  initializeRedis: jest.fn().mockResolvedValue(undefined),
}));

let testDbInitialized = false;

beforeAll(async () => {
  // Use a separate test database
  process.env.DB_NAME = process.env.DB_NAME_TEST || `${config.db.name}_test`;
  process.env.REDIS_HOST = 'mocked_redis_host'; // Ensure Redis mock is used

  // Re-import config to get updated DB_NAME
  jest.resetModules();
  const { config: testConfig } = await import('../src/config/config');
  const { AppDataSource: TestAppDataSource, initializeDataSource: TestInitializeDataSource } = await import('../src/database/data-source');

  // Configure test data source
  TestAppDataSource.setOptions({
    database: testConfig.db.name,
    logging: false, // Turn off logging for tests
    synchronize: false, // Ensure synchronize is false
    dropSchema: true, // Drop schema to ensure clean state for each test run
  });

  if (!TestAppDataSource.isInitialized) {
    try {
      await TestAppDataSource.initialize();
      logger.info(`Test Database '${testConfig.db.name}' connected!`);
      testDbInitialized = true;
      // Run migrations for the test database
      await TestAppDataSource.runMigrations();
      logger.info('Test database migrations ran.');
    } catch (error) {
      logger.error('Failed to connect or migrate test database:', error);
      process.exit(1);
    }
  }

  // Clear mock calls for each test file
  beforeEach(() => {
    mockRedisClient.get.mockClear();
    mockRedisClient.setex.mockClear();
    mockRedisClient.del.mockClear();
    mockRedisClient.keys.mockClear();
  });
});

afterAll(async () => {
  if (testDbInitialized && AppDataSource.isInitialized) {
    try {
      // Clean up database after all tests
      await AppDataSource.dropDatabase();
      await AppDataSource.destroy();
      logger.info('Test Database disconnected and schema dropped!');
    } catch (error) {
      logger.error('Failed to destroy test database:', error);
    }
  }
});
```