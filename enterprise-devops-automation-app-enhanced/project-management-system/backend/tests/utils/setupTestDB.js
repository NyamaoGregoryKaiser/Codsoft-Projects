```javascript
const { sequelize } = require('../../src/models');
const config = require('../../src/config');
const logger = require('../../src/config/logger');

const setupTestDB = () => {
  beforeAll(async () => {
    // Ensure NODE_ENV is set to 'test'
    if (config.env !== 'test') {
      throw new Error('NODE_ENV must be "test" for setupTestDB to run.');
    }

    // Connect to the test database
    await sequelize.authenticate();
    logger.info('Connected to PostgreSQL test database!');
  });

  beforeEach(async () => {
    // Drop all tables and recreate them, then run migrations/seeders
    await sequelize.sync({ force: true });
    // If you have specific seeders for tests, you might run them here
    // e.g., await runTestSeeders();
    logger.debug('Test database synchronized and reset.');
  });

  afterAll(async () => {
    // Close the database connection after all tests
    await sequelize.close();
    logger.info('PostgreSQL test database connection closed.');
  });
};

module.exports = setupTestDB;
```