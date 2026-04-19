```typescript
import { AppDataSource } from '../config/db';
import { config } from '../config/config';
import { User } from '../models/User';
import { Dataset } from '../models/Dataset';
import { Visualization } from '../models/Visualization';
import { Dashboard } from '../models/Dashboard';
import * as bcrypt from 'bcryptjs';

// Ensure test environment is set
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://test_user:test_password@localhost:5433/test_data_viz_db';

beforeAll(async () => {
  // Use a separate test database connection, or mock it entirely
  // For integration tests, a real DB is preferred.
  // Temporarily override config to point to test DB
  config.DATABASE_URL = process.env.DATABASE_URL;

  // Initialize DB for tests, ensuring it's empty
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true); // Drops schema and recreates it
    console.log('Test database initialized and synchronized.');
  } catch (error) {
    console.error('Error initializing test database:', error);
    process.exit(1);
  }
});

afterEach(async () => {
  // Clean up database after each test
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
  }
});

afterAll(async () => {
  await AppDataSource.destroy();
  console.log('Test database connection closed.');
});
```