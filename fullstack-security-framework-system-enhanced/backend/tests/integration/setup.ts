import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { env } from '@config/env';

const prisma = new PrismaClient({
  datasources: {
    db: { url: env.databaseUrl }
  }
});

// Ensure a separate test database
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST || "postgresql://user:password@localhost:5432/test_secure_app_db?schema=public";

beforeAll(async () => {
  // Apply migrations to the test database
  try {
    execSync('pnpm prisma migrate dev --name integration_test_init --skip-seed', { stdio: 'inherit', cwd: 'backend' });
    console.log('Test database migrations applied.');
  } catch (error) {
    console.error('Error applying test database migrations:', error);
    process.exit(1);
  }
});

afterEach(async () => {
  // Clear the database after each test
  await prisma.token.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  // Disconnect Prisma
  await prisma.$disconnect();
});