```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminId = uuidv4();
    const userId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: userId,
        username: 'testuser',
        email: 'user@example.com',
        password: hashedPassword,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});

    await queryInterface.bulkInsert('products', [
      {
        id: uuidv4(),
        name: 'Laptop Pro X',
        description: 'Powerful laptop for professionals.',
        price: 1200.00,
        stock: 50,
        userId: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Mechanical Keyboard',
        description: 'RGB Mechanical keyboard with clicky switches.',
        price: 99.99,
        stock: 200,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse.',
        price: 45.50,
        stock: 150,
        userId: adminId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};
```