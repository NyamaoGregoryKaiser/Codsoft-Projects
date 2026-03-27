import 'reflect-metadata';
import { AppDataSource } from '../src/db/data-source';
import logger from '../src/config/logger';

// This file sets up the database for integration/API tests.
// Unit tests should mock the database layer.

beforeAll(async () => {
  if (!AppDataSource.isInitialized) {
    try {
      await AppDataSource.initialize();
      logger.info('Test database connection established.');

      // Run migrations to ensure schema is up to date for tests
      await AppDataSource.runMigrations();
      logger.info('Test database migrations run.');

      // You might want to clear and re-seed data before each test or test suite
      // depending on your isolation strategy. For simplicity, we seed once.
      // For proper isolation, use transactions or `beforeEach`/`afterEach` to reset state.

    } catch (error) {
      logger.error('Failed to connect or migrate test database:', error);
      process.exit(1);
    }
  }
});

beforeEach(async () => {
  // Clear all data before each test to ensure isolation
  if (AppDataSource.isInitialized) {
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
    }
    // Re-seed essential data like the admin user if needed for tests
    // For this example, we'll manually seed specific data in tests or rely on initial seed
  }
});

afterAll(async () => {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    logger.info('Test database connection closed.');
  }
});
```

#### `pms-api/backend/tests/unit/utils/password.test.ts`
```typescript