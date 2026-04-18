import { AppDataSource } from '../src/data-source';
import redisClient from '../src/config/redis';
import logger from '../src/config/logger';

// Mock logger to prevent actual log file creation during tests
jest.mock('../src/config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    // Ensure test database is clean before running tests
    await AppDataSource.initialize();
    await AppDataSource.dropDatabase();
    await AppDataSource.runMigrations(); // Run migrations to set up schema
    // Optionally run a test-specific seed or clear data here
  }
  await redisClient.connect(); // Connect to redis for tests
});

afterEach(async () => {
  // Clear data from all tables after each test to ensure isolation
  await AppDataSource.manager.query('TRUNCATE TABLE content_tags RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE content RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE categories RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE tags RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE users RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE roles RESTART IDENTITY CASCADE;');
  await AppDataSource.manager.query('TRUNCATE TABLE media RESTART IDENTITY CASCADE;');

  // Clear redis cache after each test
  await redisClient.flushdb();
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  await redisClient.quit(); // Disconnect redis
});