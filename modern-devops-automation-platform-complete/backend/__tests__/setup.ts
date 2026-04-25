```typescript
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import path from 'path';
import { User } from '../src/entities/User';
import { Project } from '../src/entities/Project';
import { Task } from '../src/entities/Task';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Use a separate test database
const testDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL?.replace(process.env.DB_NAME || 'project_management_db', 'test_project_management_db'),
  logging: false,
  entities: [User, Project, Task],
  migrations: [], // No migrations for tests, recreate schema directly
  synchronize: true, // Use synchronize for test environment for easy setup
});

beforeAll(async () => {
  if (!testDataSource.isInitialized) {
    await testDataSource.initialize();
  }
  // Drop and recreate schema for a clean slate before each test run
  await testDataSource.dropDatabase();
  await testDataSource.synchronize(true);
});

afterAll(async () => {
  if (testDataSource.isInitialized) {
    await testDataSource.destroy();
  }
});

// Expose the test data source if controllers/services need it directly
export { testDataSource };
```