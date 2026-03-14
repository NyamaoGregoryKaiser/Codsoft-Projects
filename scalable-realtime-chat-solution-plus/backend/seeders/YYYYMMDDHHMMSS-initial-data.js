```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const user1Id = uuidv4();
    const user2Id = uuidv4();
    const user3Id = uuidv4();

    await queryInterface.bulkInsert('Users', [
      {
        id: user1Id,
        username: 'alice',
        email: 'alice@example.com',
        password: hashedPassword,
        status: 'online',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user2Id,
        username: 'bob',
        email: 'bob@example.com',
        password: hashedPassword,
        status: 'offline',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: user3Id,
        username: 'charlie',
        email: 'charlie@example.com',
        password: hashedPassword,
        status: 'away',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    const room1Id = uuidv4();
    const room2Id = uuidv4();

    await queryInterface.bulkInsert('Rooms', [
      {
        id: room1Id,
        name: 'General Chat',
        description: 'A public room for general discussion.',
        isPrivate: false,
        creatorId: user1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: room2Id,
        name: 'Dev Team',
        description: 'Private chat for the development team.',
        isPrivate: true,
        creatorId: user2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    await queryInterface.bulkInsert('UserRooms', [
      { userId: user1Id, roomId: room1Id, createdAt: new Date(), updatedAt: new Date() },
      { userId: user2Id, roomId: room1Id, createdAt: new Date(), updatedAt: new Date() },
      { userId: user3Id, roomId: room1Id, createdAt: new Date(), updatedAt: new Date() },
      { userId: user1Id, roomId: room2Id, createdAt: new Date(), updatedAt: new Date() },
      { userId: user2Id, roomId: room2Id, createdAt: new Date(), updatedAt: new Date() },
    ], {});

    await queryInterface.bulkInsert('Messages', [
      {
        id: uuidv4(),
        content: 'Welcome to General Chat!',
        senderId: user1Id,
        roomId: room1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        content: 'Hey everyone!',
        senderId: user2Id,
        roomId: room1Id,
        createdAt: new Date(Date.now() + 1000), // Ensure different timestamps
        updatedAt: new Date(Date.now() + 1000),
      },
      {
        id: uuidv4(),
        content: 'Hello Dev Team!',
        senderId: user1Id,
        roomId: room2Id,
        createdAt: new Date(Date.now() + 2000),
        updatedAt: new Date(Date.now() + 2000),
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Messages', null, {});
    await queryInterface.bulkDelete('UserRooms', null, {});
    await queryInterface.bulkDelete('Rooms', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
```