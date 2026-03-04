'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Seeder} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const adminId = uuidv4();
    const userId = uuidv4();

    const hashedPasswordAdmin = await bcrypt.hash('adminpassword', 12);
    const hashedPasswordUser = await bcrypt.hash('userpassword', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPasswordAdmin,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: userId,
        username: 'testuser',
        email: 'user@example.com',
        password: hashedPasswordUser,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    await queryInterface.bulkInsert('products', [
      {
        id: uuidv4(),
        name: 'Laptop Pro X',
        description: 'High-performance laptop for professionals.',
        price: 1200.00,
        stock: 50,
        imageUrl: 'https://example.com/laptop_pro_x.jpg',
        userId: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Wireless Ergonomic Mouse',
        description: 'Comfortable mouse for long working hours.',
        price: 25.99,
        stock: 200,
        imageUrl: 'https://example.com/ergonomic_mouse.jpg',
        userId: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'USB-C Hub 7-in-1',
        description: 'Expand your laptop\'s connectivity.',
        price: 49.99,
        stock: 150,
        imageUrl: 'https://example.com/usb_c_hub.jpg',
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};