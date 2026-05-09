import { execSync } from 'child_process';
import { resolve } from 'path';
import prisma from '../src/config/database';
import { redisClient } from '../src/middleware/cache.middleware';

// Set up a test database URL
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || 'postgresql://user:password@localhost:5433/testdb?schema=public';
// Use a separate Redis instance or namespace for tests
process.env.REDIS_URL = process.env.REDIS_URL_TEST || 'redis://localhost:6380';
process.env.NODE_ENV = 'test'; // Ensure NODE_ENV is set for tests

// Before all tests, ensure the test database is clean and migrated
beforeAll(async () => {
  console.log('Setting up test environment...');
  try {
    // Drop and recreate test database (or reset using `prisma migrate reset`)
    // For a robust test setup, consider a tool like `jest-environment-prisma`
    // or managing a fresh database per test file/suite.
    // For simplicity, we'll just run migrate deploy.
    // In a real project, you might wipe data more aggressively or use transactions.
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    execSync(`ts-node ${resolve(__dirname, '../prisma/seed.ts')}`, { stdio: 'inherit' });
    console.log('Test database migrated and seeded.');

    // Connect Redis client
    if (!redisClient.isReady) {
      await redisClient.connect();
    }
    await redisClient.flushdb(); // Clear cache before tests
    console.log('Redis connected and flushed for tests.');
  } catch (error) {
    console.error('Failed to set up test environment:', error);
    process.exit(1);
  }
});

// After all tests, disconnect Prisma and Redis
afterAll(async () => {
  console.log('Tearing down test environment...');
  await prisma.$disconnect();
  if (redisClient.isReady) {
    await redisClient.flushdb(); // Clear cache after tests
    await redisClient.disconnect();
  }
  console.log('Test environment torn down.');
});

// Before each test, potentially clear specific data (depends on test strategy)
beforeEach(async () => {
  // Clear refresh tokens to ensure isolation between auth tests
  await prisma.token.deleteMany();
  await redisClient.flushdb(); // Clear cache for each test
});