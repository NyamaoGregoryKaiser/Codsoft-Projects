'use strict';

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords before inserting
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('securepass', 10);

    const user1Id = uuidv4();
    const user2Id = uuidv4();

    await queryInterface.bulkInsert('Users', [{
      id: user1Id,
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword1,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: user2Id,
      username: 'testuser',
      email: 'user@example.com',
      password: hashedPassword2,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    await queryInterface.bulkInsert('Products', [{
      id: uuidv4(),
      name: 'Laptop X',
      description: 'High-performance laptop for gaming and work.',
      price: 1500.00,
      stock: 100,
      userId: user1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: uuidv4(),
      name: 'Mechanical Keyboard',
      description: 'RGB Mechanical Keyboard with Cherry MX Blue switches.',
      price: 120.50,
      stock: 50,
      userId: user1Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }, {
      id: uuidv4(),
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with long battery life.',
      price: 45.99,
      stock: 200,
      userId: user2Id,
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```

```