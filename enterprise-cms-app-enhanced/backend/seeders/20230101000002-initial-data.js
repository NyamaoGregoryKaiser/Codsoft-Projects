'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminUserId = uuidv4();
    const editorUserId = uuidv4();
    const normalUserId = uuidv4();

    const category1Id = uuidv4();
    const category2Id = uuidv4();

    await queryInterface.bulkInsert('Users', [
      {
        id: adminUserId,
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('adminpassword', 10),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: editorUserId,
        name: 'Editor User',
        email: 'editor@example.com',
        password: await bcrypt.hash('editorpassword', 10),
        role: 'editor',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: normalUserId,
        name: 'Normal User',
        email: 'user@example.com',
        password: await bcrypt.hash('userpassword', 10),
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('Categories', [
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
        description: 'Posts about daily life and well-being.',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await queryInterface.bulkInsert('Posts', [
      {
        id: uuidv4(),
        title: 'Getting Started with Node.js',
        slug: 'getting-started-with-node-js',
        content: 'This is the first post about Node.js development. It covers basic setup and principles.',
        status: 'published',
        publishedAt: new Date(),
        authorId: adminUserId,
        categoryId: category1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'The Joys of Healthy Eating',
        slug: 'the-joys-of-healthy-eating',
        content: 'A comprehensive guide to maintaining a healthy diet and lifestyle.',
        status: 'published',
        publishedAt: new Date(),
        authorId: editorUserId,
        categoryId: category2Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Draft Post Example',
        slug: 'draft-post-example',
        content: 'This post is still in draft mode and not yet published.',
        status: 'draft',
        publishedAt: null,
        authorId: adminUserId,
        categoryId: category1Id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Posts', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  },
};