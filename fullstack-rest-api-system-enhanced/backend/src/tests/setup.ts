import { AppDataSource } from '../database';
import { logger } from '../config/logger';
import { redisClient } from '../shared/utils/cache';

beforeAll(async () => {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      logger.info('Test database connection established.');
      await AppDataSource.runMigrations(); // Ensure migrations are run for tests
      logger.info('Test database migrations run.');
    }
    await redisClient.connect(); // Connect Redis for tests
    await redisClient.del('*'); // Clear Redis cache before tests
  } catch (error) {
    logger.error('Error during test setup:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    // Clean up database after all tests
    if (AppDataSource.isInitialized) {
        await AppDataSource.dropDatabase(); // Clears all tables
        await AppDataSource.runMigrations(); // Re-run migrations to have schema for next test suite
        await AppDataSource.destroy();
        logger.info('Test database connection closed.');
    }
    await redisClient.disconnect();
  } catch (error) {
    logger.error('Error during test teardown:', error);
    process.exit(1);
  }
});

// Clear database before each test suite (or each test if preferred)
beforeEach(async () => {
    // This provides a clean slate for each test file (or test block)
    // You might want to truncate specific tables or reload seed data here
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
        const repository = AppDataSource.getRepository(entity.name);
        await repository.query(`TRUNCATE TABLE "${entity.tableName}" RESTART IDENTITY CASCADE;`);
    }
    await redisClient.del('*'); // Clear cache again for each test file/suite
});