'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminId = uuidv4();
    const editorId = uuidv4();
    const authorId = uuidv4();
    const subscriberId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: editorId,
        username: 'editor',
        email: 'editor@example.com',
        password: await bcrypt.hash('editorpassword', 10),
        role: 'editor',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: authorId,
        username: 'author',
        email: 'author@example.com',
        password: await bcrypt.hash('authorpassword', 10),
        role: 'author',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: subscriberId,
        username: 'subscriber',
        email: 'subscriber@example.com',
        password: await bcrypt.hash('subscriberpassword', 10),
        role: 'subscriber',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    const category1Id = uuidv4();
    const category2Id = uuidv4();

    await queryInterface.bulkInsert('categories', [
      {
        id: category1Id,
        name: 'Technology',
        slug: 'technology',
        description: 'Posts about technology and gadgets.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: category2Id,
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Posts about daily life, health, and well-being.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    await queryInterface.bulkInsert('posts', [
      {
        id: uuidv4(),
        title: 'The Future of AI in Content Creation',
        slug: 'future-of-ai-content-creation',
        content: 'Artificial intelligence is rapidly transforming how content is created...',
        status: 'published',
        publishedAt: new Date(),
        authorId: authorId,
        categoryId: category1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Mastering Remote Work Productivity',
        slug: 'mastering-remote-work-productivity',
        content: 'Working remotely has its challenges, but with the right strategies...',
        status: 'draft',
        publishedAt: null,
        authorId: authorId,
        categoryId: category2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Latest Trends in Web Development',
        slug: 'latest-trends-web-development',
        content: 'Keeping up with web development trends is crucial for modern developers...',
        status: 'published',
        publishedAt: new Date(),
        authorId: editorId, // Editor can also create posts
        categoryId: category1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('posts', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
};