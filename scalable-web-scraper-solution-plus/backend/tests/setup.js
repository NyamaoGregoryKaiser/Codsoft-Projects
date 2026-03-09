```javascript
const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');
const config = require('../src/config');

// Ensure test database is used
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `postgres://${config.database.user}:${config.database.pass}@${config.database.host}:${config.database.port}/${config.database.name}_test`;

beforeAll(async () => {
  try {
    // Drop all tables and recreate them from models
    await sequelize.sync({ force: true });
    logger.info('Test database reset and synced.');

    // Run seeders for test data
    // You might want to create specific test seeders or use a subset of main seeders
    // For simplicity, we'll re-seed with standard users.
    const { User } = require('../src/models');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const hashedPasswordAdmin = await bcrypt.hash('adminpassword', 10);
    const hashedPasswordUser = await bcrypt.hash('userpassword', 10);

    await User.bulkCreate([
      {
        id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', // Fixed UUID for predictable testing
        username: 'testadmin',
        email: 'testadmin@example.com',
        password: hashedPasswordAdmin,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Fixed UUID for predictable testing
        username: 'testuser',
        email: 'testuser@example.com',
        password: hashedPasswordUser,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    logger.info('Test database seeded with initial users.');

  } catch (error) {
    logger.error('Error during test setup:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    // Close the database connection after all tests are done
    await sequelize.close();
    logger.info('Test database connection closed.');
  } catch (error) {
    logger.error('Error during test teardown:', error);
  }
});
```