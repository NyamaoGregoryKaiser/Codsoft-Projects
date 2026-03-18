```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUserId = uuidv4();
    const regularUserId = uuidv4();
    const generalRoomId = uuidv4();
    const privateRoomId = uuidv4();

    const hashedPassword = await bcrypt.hash('password123', 10);

    // Seed Users
    await queryInterface.bulkInsert(
      'users',
      [
        {
          id: adminUserId,
          username: 'adminuser',
          email: 'admin@example.com',
          password: hashedPassword,
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: regularUserId,
          username: 'john_doe',
          email: 'john@example.com',
          password: hashedPassword,
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // Seed Chat Rooms
    await queryInterface.bulkInsert(
      'chat_rooms',
      [
        {
          id: generalRoomId,
          name: 'General Chat',
          description: 'A public room for general discussions.',
          isPrivate: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: privateRoomId,
          name: 'Admins Only',
          description: 'A private room for admin discussions.',
          isPrivate: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // Seed UserChatRooms (users joining rooms)
    await queryInterface.bulkInsert(
      'UserChatRooms',
      [
        {
          userId: adminUserId,
          chatRoomId: generalRoomId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: regularUserId,
          chatRoomId: generalRoomId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          userId: adminUserId,
          chatRoomId: privateRoomId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );

    // Seed Messages (optional)
    await queryInterface.bulkInsert(
      'messages',
      [
        {
          id: uuidv4(),
          chatRoomId: generalRoomId,
          userId: adminUserId,
          content: 'Hello everyone in the General Chat!',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          chatRoomId: generalRoomId,
          userId: regularUserId,
          content: 'Hi Admin! Glad to be here.',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      {}
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Order matters for deletion due to foreign key constraints
    await queryInterface.bulkDelete('messages', null, {});
    await queryInterface.bulkDelete('UserChatRooms', null, {});
    await queryInterface.bulkDelete('chat_rooms', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
```