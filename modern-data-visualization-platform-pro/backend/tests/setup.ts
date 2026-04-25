import 'reflect-metadata';
import { AppDataSource } from '@db/data-source';
import logger from '@config/logger';
import { redisClient } from '@config/redis';

// Set environment to 'test' for consistent test behavior
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret'; // Use a dedicated secret for testing

/**
 * Global setup for Jest tests.
 * Initializes the database connection and clears it before all tests.
 */
beforeAll(async () => {
  logger.info('Global test setup: Initializing database connection...');
  try {
    if (!AppDataSource.isInitialized) {
      // Use test database credentials if different, or ensure DB_NAME points to test_db
      // This setup assumes a "test_db" is configured in .env and data-source.ts or an override
      await AppDataSource.initialize();
      logger.info('Database initialized for testing.');
    } else {
      logger.info('Database already initialized.');
    }

    // Ensure database is clean before running tests
    await AppDataSource.dropDatabase();
    await AppDataSource.runMigrations(); // Re-run migrations to create schema
    logger.info('Database schema recreated for tests.');

    // Clear Redis cache before tests
    if (redisClient.isReady) {
      await redisClient.flushdb();
      logger.info('Redis cache flushed for tests.');
    }

  } catch (error) {
    logger.error('Error during test setup:', error);
    process.exit(1); // Exit if setup fails
  }
});

/**
 * Global teardown for Jest tests.
 * Closes the database connection after all tests are done.
 */
afterAll(async () => {
  logger.info('Global test teardown: Closing database connection...');
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      logger.info('Database connection closed after tests.');
    }
    if (redisClient.isReady) {
      await redisClient.quit();
      logger.info('Redis client disconnected after tests.');
    }
  } catch (error) {
    logger.error('Error during test teardown:', error);
  }
});

/**
 * Clean up database after each test if necessary, e.g., for integration tests.
 * For unit tests, typically no DB interaction, so not strictly needed.
 */
// beforeEach(async () => {
//   // If you want a fresh state for each integration test:
//   // await AppDataSource.query(`TRUNCATE TABLE users, datasets, dashboards, visualizations RESTART IDENTITY CASCADE;`);
//   // await redisClient.flushdb();
// });