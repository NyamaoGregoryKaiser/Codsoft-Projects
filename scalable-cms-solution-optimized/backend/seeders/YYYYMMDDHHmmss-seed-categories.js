'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const categoriesData = [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Technology',
        slug: 'technology',
        description: 'Posts related to technology and software development.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'News',
        slug: 'news',
        description: 'Latest news and updates.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'How-to guides and tutorials.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        name: 'Lifestyle',
        slug: 'lifestyle',
        description: 'Articles on personal growth, health, and daily life.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('categories', categoriesData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('categories', null, {});
  }
};
```