```typescript
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';
import config from '../config';

// Use a separate test database
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || `postgresql://testuser:testpassword@localhost:5432/test_webscraperdb?schema=public`;

const prisma = new PrismaClient();

beforeAll(async () => {
  // Ensure the test database exists and is empty
  try {
    // Drop and recreate test database
    execSync(`dropdb --if-exists test_webscraperdb`);
    execSync(`createdb test_webscraperdb`);
    // Run migrations on the test database
    execSync(`npx prisma migrate deploy --preview-feature`, {
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
      cwd: path.resolve(__dirname, '../../') // Adjust to prisma folder if needed
    });
    console.log('Test database migrated.');
  } catch (error) {
    console.error('Error setting up test database:', error);
    process.exit(1);
  }
});

afterEach(async () => {
  // Clear data after each test to ensure isolation
  await prisma.$transaction([
    prisma.scrapingResult.deleteMany(),
    prisma.scrapingJob.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
  // Optionally, drop the test database after all tests are done
  try {
    execSync(`dropdb --if-exists test_webscraperdb`);
    console.log('Test database dropped.');
  } catch (error) {
    console.error('Error tearing down test database:', error);
  }
});
```