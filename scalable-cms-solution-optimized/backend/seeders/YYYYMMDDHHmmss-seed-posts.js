'use strict';

const { User, Category } = require('../src/models'); // Import models to get IDs

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Fetch IDs of existing users and categories
    const adminUser = await User.findOne({ where: { email: 'admin@example.com' } });
    const editorUser = await User.findOne({ where: { email: 'editor@example.com' } });
    const techCategory = await Category.findOne({ where: { slug: 'technology' } });
    const newsCategory = await Category.findOne({ where: { slug: 'news' } });
    const tutorialsCategory = await Category.findOne({ where: { slug: 'tutorials' } });

    if (!adminUser || !editorUser || !techCategory || !newsCategory || !tutorialsCategory) {
      console.warn('Skipping post seeding: Dependent users or categories not found.');
      return;
    }

    const postsData = [
      {
        id: Sequelize.literal('gen_random_uuid()'),
        title: 'Getting Started with Node.js and Express',
        slug: 'getting-started-nodejs-express',
        content: 'This tutorial covers the basics of setting up a Node.js project with Express, including routing, middleware, and database integration. Learn how to build powerful backend APIs efficiently.',
        excerpt: 'A comprehensive guide to building your first API with Node.js and Express.',
        status: 'published',
        featuredImage: 'https://images.unsplash.com/photo-1616400619175-5cafcd6eeade?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        authorId: adminUser.id,
        categoryId: techCategory.id,
        createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        title: 'The Future of AI in Content Creation',
        slug: 'future-ai-content-creation',
        content: 'Artificial intelligence is rapidly transforming how we create and consume content. From generating articles to personalizing recommendations, AI tools are becoming indispensable for content creators and marketers alike.',
        excerpt: 'Exploring the impact of AI on content creation and its implications for the industry.',
        status: 'published',
        featuredImage: 'https://images.unsplash.com/photo-1678070940428-c11458e08d6d?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        authorId: editorUser.id,
        categoryId: newsCategory.id,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        title: '10 Tips for Writing Engaging Blog Posts',
        slug: '10-tips-writing-engaging-blog-posts',
        content: 'Writing blog posts that capture your audience\'s attention requires more than just good ideas. Learn these ten essential tips to make your content shine and keep readers coming back for more.',
        excerpt: 'Improve your blog writing with these practical and effective tips.',
        status: 'draft',
        featuredImage: 'https://images.unsplash.com/photo-1497032628184-c52dfc572f68?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        publishedAt: null,
        authorId: editorUser.id,
        categoryId: tutorialsCategory.id,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: Sequelize.literal('gen_random_uuid()'),
        title: 'Building a Microservices Architecture with Docker',
        slug: 'microservices-architecture-docker',
        content: 'Microservices offer modularity and scalability for complex applications. This post dives into how Docker can be leveraged to containerize and orchestrate a microservices architecture, enhancing deployment and management.',
        excerpt: 'An in-depth look at designing and implementing microservices using Docker containers.',
        status: 'archived',
        featuredImage: 'https://images.unsplash.com/photo-1594916894314-e0b2a6d7f8a9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
        publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        authorId: adminUser.id,
        categoryId: techCategory.id,
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
      }
    ];

    await queryInterface.bulkInsert('posts', postsData, {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('posts', null, {});
  }
};
```