const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { execSync } = require('child_process');
const path = require('path');
const logger = require('../src/utils/logger'); // Use server's logger

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/ml_utilities_test?schema=public';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.BCRYPT_SALT_ROUNDS = '1'; // Faster bcrypt for tests
process.env.UPLOAD_DIR = path.join(__dirname, '../uploads-test'); // Separate upload dir for tests

module.exports = async () => {
  logger.info('Global test setup: Running migrations...');
  try {
    // Drop all data and apply migrations
    // Use `migrate reset --force` for a clean slate, then `migrate deploy`
    execSync('npx prisma migrate reset --force', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'pipe', // Capture output
    });
    execSync('npx prisma migrate deploy', {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
      stdio: 'pipe',
    });
    logger.info('Migrations applied successfully for test database.');

    // Ensure test upload directory exists
    const fs = require('fs');
    if (!fs.existsSync(process.env.UPLOAD_DIR)) {
      fs.mkdirSync(process.env.UPLOAD_DIR, { recursive: true });
    }
  } catch (error) {
    logger.error('Error during test database setup:', error.stdout ? error.stdout.toString() : error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};