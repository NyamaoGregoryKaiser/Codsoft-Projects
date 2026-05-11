'use strict';

const bcrypt = require('bcryptjs');
const config = require('../src/config/config');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const saltRounds = config.bcryptSaltRounds;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const editorPassword = await bcrypt.hash('editor123', saltRounds);
    const viewerPassword = await bcrypt.hash('viewer123', saltRounds);

    const usersData = [
      {
        id: Sequelize.literal('gen_random_uuid()'), // PostgreSQL specific for UUID V4
        username: 'admin',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        username: 'editor',
        email: 'editor@example.com',
        password: editorPassword,
        role: 'editor',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        username: 'viewer',
        email: 'viewer@example.com',
        password: viewerPassword,
        role: 'viewer',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', usersData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
```