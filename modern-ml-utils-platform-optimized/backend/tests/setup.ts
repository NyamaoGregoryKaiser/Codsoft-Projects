import 'reflect-metadata';
import AppDataSource from '../src/database/datasource';
import logger from '../src/config/logger';

// Ensure the test database name is different from development/production
process.env.DB_DATABASE = process.env.DB_DATABASE || 'ml_utilities_test_db';

// Before all tests, initialize the database connection
beforeAll(async () => {
  try {
    // Reconfigure AppDataSource to connect to the test database
    // This is crucial to avoid conflicting with dev/prod databases.
    Object.assign(AppDataSource.options, {
      database: process.env.DB_DATABASE,
      synchronize: false, // Always false for migrations
      logging: false,
    });

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Test database connection initialized');
    }

    // Drop schema and run migrations for a clean state before tests
    await AppDataSource.dropDatabase();
    await AppDataSource.runMigrations(); // This also creates the schema if empty

    // Seed test data if needed for all tests (or seed per test suite)
    // For this example, we'll rely on the seed script from `npm run seed` in docker-compose,
    // or you could manually insert test data here for isolated tests.
    // For Jest `npm test`, we manually run drop + migrations in setup.

  } catch (error) {
    logger.error('Error during test database setup:', error);
    process.exit(1);
  }
});

// After all tests, close the database connection
afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Test database connection closed');
  }
});
```

**backend/tests/unit/auth.service.test.ts** (Unit tests)
```typescript