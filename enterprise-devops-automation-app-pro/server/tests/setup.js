// setup.js - for global Jest setup
const { sequelize } = require('../models');
const logger = require('../utils/logger');

// Temporarily disable logging during tests
logger.level = 'silent';

beforeAll(async () => {
  // Use a test database URL defined in test config or env
  const testSequelize = require('../config/config').sequelize;
  // Ensure we are using the in-memory SQLite for testing or a separate test DB
  if (testSequelize.options.dialect === 'sqlite' || testSequelize.options.url.includes('_test')) {
    await testSequelize.sync({ force: true }); // Clear and recreate tables for each test run
    // You might want to run seeders here for common test data
    // await require('../seeders/20231220110000-seed-users-products').up(testSequelize.getQueryInterface(), testSequelize.Sequelize);
  }
});

afterAll(async () => {
  const testSequelize = require('../config/config').sequelize;
  if (testSequelize.options.dialect === 'sqlite') {
    await testSequelize.close(); // Close connection for in-memory SQLite
  } else if (testSequelize.options.url.includes('_test')) {
    // For a real test DB, you might want to truncate tables or drop the database
    // await testSequelize.drop();
  }
});

// Mock Redis client for tests
jest.mock('../utils/redisClient', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  connect: jest.fn(),
  on: jest.fn(),
  isReady: true, // Always ready for tests
}));