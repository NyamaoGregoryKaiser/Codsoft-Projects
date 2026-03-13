```typescript
import 'reflect-metadata';
import { AppDataSource, initializeDataSource, closeDataSource } from '../src/data-source';
import { config } from '../src/config';
import { connectRedis, disconnectRedis } from '../src/shared/redis-client';

beforeAll(async () => {
  // Ensure we are in a test environment
  process.env.NODE_ENV = 'test';
  config.isTest = true; // Update config for tests

  // Important: Use a separate test database
  // The ormconfig.ts and AppDataSource are configured to use environment variables.
  // Make sure your `DB_DATABASE` in .env.test or similar points to a test DB.
  process.env.DB_DATABASE = process.env.DB_TEST_DATABASE || 'dboptimizer_test_db';

  await initializeDataSource();
  await connectRedis();

  // Clear database before all tests, then run migrations for a clean state
  await AppDataSource.dropDatabase();
  await AppDataSource.runMigrations();

  console.log('Test environment setup complete. DB and Redis initialized, migrations run.');
});

afterAll(async () => {
  // Clean up database after all tests (optional, sometimes useful to inspect test DB)
  // await AppDataSource.dropDatabase();
  await closeDataSource();
  await disconnectRedis();
  console.log('Test environment teardown complete. DB and Redis closed.');
});
```