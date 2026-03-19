import { AppDataSource } from '../database';
import { logger } from '../config/logger';

// Mock DB_DATABASE for tests if needed, or use a dedicated test DB.
// For simplicity, we'll just connect to a test database.
// In a real scenario, you'd likely use a separate DB instance for tests,
// or a transactional approach to rollback changes after each test.
process.env.DB_DATABASE = process.env.DB_DATABASE_TEST || 'ecommercedb_test';

beforeAll(async () => {
  try {
    await AppDataSource.initialize();
    logger.info('Test database connected.');
    // Run migrations before tests start
    await AppDataSource.runMigrations();
    logger.info('Test database migrations run.');
  } catch (error) {
    logger.error('Failed to connect to test database or run migrations:', error);
    process.exit(1);
  }
});

beforeEach(async () => {
  // Clear tables before each test to ensure isolation
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    // Be cautious with truncate, it can reset sequences. DELETE FROM is safer
    await repository.query(`DELETE FROM "${entity.tableName}";`);
  }
  logger.debug('Cleared database tables before test.');
});

afterAll(async () => {
  await AppDataSource.destroy();
  logger.info('Test database connection closed.');
});