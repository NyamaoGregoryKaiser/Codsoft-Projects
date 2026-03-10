import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { env } from '@config/env';

const prisma = new PrismaClient({
  datasources: {
    db: { url: env.databaseUrl }
  }
});

module.exports = async () => {
  // Optionally, drop the test database
  // This can be risky, ensure the DATABASE_URL_TEST is correctly configured.
  if (process.env.DATABASE_URL_TEST && process.env.NODE_ENV === 'test') {
    console.log('Dropping test database...');
    // A safer way is to use `prisma db drop --force` if available for specific versions,
    // or connect to 'postgres' db and drop the test db.
    try {
      execSync('pnpm prisma migrate reset --force --skip-generate --skip-seed', { stdio: 'inherit', cwd: 'backend' });
      console.log('Test database reset/dropped.');
    } catch (error) {
      console.error('Error dropping test database:', error);
    }
  }

  await prisma.$disconnect();
};