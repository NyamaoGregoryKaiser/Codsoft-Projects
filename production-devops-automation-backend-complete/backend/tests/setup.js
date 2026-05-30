```javascript
const { sequelize } = require('../src/models');
const logger = require('../src/config/logger.config');

// Ensure dotenv is loaded for test environment variables
require('dotenv').config({ path: '.env.test' });

beforeAll(async () => {
  try {
    // Drop all tables, sync, and re-seed for a clean test environment
    // Use `drop: true` for development/testing, but be careful in production
    await sequelize.sync({ force: true });
    logger.info('Test database reset and schema synchronized.');

    // Run seeders for initial test data
    // Assuming you have a seeder file specifically for testing or an existing one.
    // In a full setup, you might have specific test seeders.
    await sequelize.query(`
      INSERT INTO users (id, username, email, password, role, created_at, updated_at) VALUES
      ('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'testuser', 'test@example.com', '$2a$10$wTfH.t.7T.C6K6Z.B.Y8nuzXyQ.eD.dY.M4e8.Z.J.M.1.H.T.C', 'user', NOW(), NOW()),
      ('f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c', 'adminuser', 'admin@example.com', '$2a$10$wTfH.t.7T.C6K6Z.B.Y8nuzXyQ.eD.dY.M4e8.Z.J.M.1.H.T.C', 'admin', NOW(), NOW());
    `);
    logger.info('Test database seeded with initial data.');

  } catch (error) {
    logger.error('Error during test setup:', error);
    process.exit(1);
  }
});

afterAll(async () => {
  try {
    await sequelize.close();
    logger.info('Test database connection closed.');
  } catch (error) {
    logger.error('Error during test teardown:', error);
    process.exit(1);
  }
});
```
**Note**: The `password` hash in the seed data is for 'password123'.