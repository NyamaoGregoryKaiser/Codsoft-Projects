```javascript
const sequelize = require('../config/sequelize');
const config = require('../config/config');
const logger = require('../utils/logger');
const { User, ContentType, Entry, Media } = require('../models');

// Use a separate test database
process.env.DB_NAME = `${config.db.database}_test`;

beforeAll(async () => {
  try {
    // Drop and re-create tables for a clean slate
    await sequelize.sync({ force: true });
    logger.info('Test database schema synchronized (forced).');

    // Create a default admin user for testing
    await User.create({
      username: 'testadmin',
      email: 'testadmin@example.com',
      password: 'password123', // Will be hashed by hook
      role: 'admin',
    });
    logger.info('Test admin user created.');

    await User.create({
      username: 'testeditor',
      email: 'testeditor@example.com',
      password: 'password123',
      role: 'editor',
    });
    logger.info('Test editor user created.');

    await User.create({
      username: 'testviewer',
      email: 'testviewer@example.com',
      password: 'password123',
      role: 'viewer',
    });
    logger.info('Test viewer user created.');

  } catch (error) {
    logger.error('Error during test setup:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  // Clear all data and close connection
  await sequelize.drop(); // Drop all tables
  await sequelize.close();
  logger.info('Test database connection closed and tables dropped.');
});
```