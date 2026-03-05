require('dotenv').config({ path: '.env.test' }); // Load test environment variables
const knex = require('./db/knex');
const logger = require('./utils/logger');

// Global setup for tests
beforeAll(async () => {
  try {
    // Run migrations for test database
    await knex.migrate.latest();
    // Seed test data if necessary
    await knex.seed.run();
    logger.info('Test database setup complete.');
  } catch (error) {
    logger.error('Error during test database setup:', error);
    process.exit(1);
  }
});

// Global teardown for tests
afterAll(async () => {
  try {
    // Rollback migrations for test database
    await knex.migrate.rollback();
    await knex.destroy();
    logger.info('Test database teardown complete.');
  } catch (error) {
    logger.error('Error during test database teardown:', error);
    process.exit(1);
  }
});