```javascript
'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Seed Users
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    const userId = await queryInterface.bulkInsert('users', [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // Seed a sample database entry (replace with your actual local/test DB details)
    await queryInterface.bulkInsert('databases', [
      {
        userId: 1, // Assuming admin user has id 1
        name: 'Local Test DB',
        dbName: 'postgres', // Or your target DB name
        dialect: 'postgres',
        host: 'db-target', // This should be a resolvable hostname from the backend container
        port: 5432,
        username: 'postgres',
        password: 'mysecretpassword', // Replace with actual password for target DB
        ssl: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('optimizations', null, {});
    await queryInterface.bulkDelete('query_plans', null, {});
    await queryInterface.bulkDelete('slow_queries', null, {});
    await queryInterface.bulkDelete('databases', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```