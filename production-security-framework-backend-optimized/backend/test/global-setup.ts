```typescript
import { config } from 'dotenv';
import { execSync } from 'child_process';
import { join } from 'path';

// Load environment variables from .env.test
config({ path: join(__dirname, '../.env.test') });

// This script will run once before all E2E tests.
// It sets up the database, runs migrations, and seeds test data.
export default async () => {
  console.log('\nGlobal E2E Setup: Starting database operations...');
  try {
    // Ensure the test database is clean and up-to-date
    // These commands assume you have `psql` or `docker` available
    // For a real CI environment, you might use specific Docker commands for a test DB.

    // 1. Drop and create database (optional, but ensures clean state)
    // You might need elevated permissions or a different user.
    // For simplicity, we'll just run migrations on the defined test DB.
    // If running in Docker, the DB is fresh each time the container starts.

    // 2. Run migrations
    console.log('Running TypeORM migrations for test database...');
    execSync('npm run typeorm migration:run', { cwd: join(__dirname, '../'), stdio: 'inherit' });
    console.log('Migrations completed.');

    // 3. Seed test data
    console.log('Seeding test data for E2E tests...');
    execSync('npm run seed', { cwd: join(__dirname, '../'), stdio: 'inherit' });
    console.log('Test data seeded.');

  } catch (error) {
    console.error('Global E2E Setup failed:', error);
    process.exit(1);
  }
};
```