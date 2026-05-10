// setup.ts
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { redis } from '../src/database/redis-client';

dotenv.config({ path: '.env.test' }); // Load test environment variables

const prisma = new PrismaClient();

// This runs once before all tests
beforeAll(async () => {
  // Ensure the test database URL is set
  if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes('testdb')) {
    throw new Error('DATABASE_URL must be configured for a test database');
  }

  // Apply migrations to the test database
  console.log('Applying Prisma migrations to test database...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: process.cwd() });
  console.log('Migrations applied.');
});

// This runs before each test
beforeEach(async () => {
  // Clear the database between tests to ensure isolation
  await prisma.$transaction([
    prisma.metric.deleteMany(),
    prisma.project.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // Clear Redis cache
  await redis.flushdb();
});

// This runs once after all tests
afterAll(async () => {
  await prisma.$disconnect();
  await redis.quit();
});