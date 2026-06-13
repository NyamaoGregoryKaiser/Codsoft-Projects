const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');
const { client: redisClient } = require('../src/services/cacheService');

// This file sets up the test environment before running tests

beforeAll(async () => {
  // Ensure database is connected for tests
  await sequelize.authenticate();
  logger.info('Test database connection established.');

  // Drop all tables and recreate them for a clean state
  await sequelize.sync({ force: true });
  logger.info('Test database synced (tables recreated).');

  // Clear Redis cache before tests
  if (redisClient.isOpen) {
    await redisClient.flushdb();
    logger.info('Redis cache flushed for tests.');
  } else {
    await redisClient.connect();
    await redisClient.flushdb();
    logger.info('Redis connected and flushed for tests.');
  }
});

afterAll(async () => {
  // Close database connection
  await sequelize.close();
  logger.info('Test database connection closed.');

  // Close Redis connection
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info('Redis client disconnected.');
  }
});