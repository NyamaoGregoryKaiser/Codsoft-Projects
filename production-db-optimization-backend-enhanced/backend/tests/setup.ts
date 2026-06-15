import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import path from 'path';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Use a separate test database or reset the main one for tests
  // For simplicity, we'll reset the local database for each test run.
  // In a real CI/CD environment, you'd provision a dedicated test DB.
  console.log('Resetting database for tests...');
  const prismaBinary = path.join(__dirname, '..', 'node_modules', '.bin', 'prisma');
  try {
    // Reset DB, apply migrations, and seed data for tests
    execSync(`${prismaBinary} migrate reset --force --skip-generate --skip-seed`, { stdio: 'inherit' });
    execSync(`${prismaBinary} generate`, { stdio: 'inherit' });
    execSync(`ts-node ${path.join(__dirname, '..', 'prisma', 'seed.ts')}`, { stdio: 'inherit' });
    console.log('Database reset and seeded successfully for tests.');
  } catch (error) {
    console.error('Failed to reset or seed database for tests:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
```