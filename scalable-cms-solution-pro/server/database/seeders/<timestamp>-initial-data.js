```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const editorPassword = await bcrypt.hash('editor123', 10);
    const authorPassword = await bcrypt.hash('author123', 10);

    const adminId = uuidv4();
    const editorId = uuidv4();
    const authorId = uuidv4();
    const techCategoryId = uuidv4();
    const newsCategoryId = uuidv4();

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        username: 'adminuser',
        email: 'admin@example.com',
        password: adminPassword,
        role: 'admin',
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: editorId,
        username: 'editoruser',
        email: 'editor@example.com',
        password: editorPassword,
        role: 'editor',
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: authorId,
        username: 'authoruser',
        email: 'author@example.com',
        password: authorPassword,
        role: 'author',
        is_email_verified: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    await queryInterface.bulkInsert('categories', [
      {
        id: techCategoryId,
        name: 'Technology',
        slug: 'technology',
        description: 'Articles about latest technology trends and gadgets.',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: newsCategoryId,
        name: 'Breaking News',
        slug: 'breaking-news',
        description: 'Latest breaking news from around the world.',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    await queryInterface.bulkInsert('posts', [
      {
        id: uuidv4(),
        title: 'The Future of AI in Content Creation',
        slug: 'future-of-ai-content-creation',
        content: 'Artificial intelligence is rapidly transforming the landscape of content creation, offering new tools for writers, designers, and marketers.',
        excerpt: 'AI is changing content creation...',
        status: 'published',
        published_at: new Date(),
        author_id: authorId,
        category_id: techCategoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Global Markets React to Economic Shifts',
        slug: 'global-markets-economic-shifts',
        content: 'Analysts are closely watching global markets as new economic data indicates potential shifts in consumer behavior and investor confidence.',
        excerpt: 'Economic shifts impact markets...',
        status: 'published',
        published_at: new Date(),
        author_id: editorId,
        category_id: newsCategoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        title: 'Draft Article: Upcoming Tech Gadgets',
        slug: 'draft-upcoming-tech-gadgets',
        content: 'This article is a draft exploring the most anticipated tech gadgets of the next year, including foldable phones and smart home devices.',
        excerpt: 'A preview of future tech...',
        status: 'draft',
        published_at: null,
        author_id: authorId,
        category_id: techCategoryId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('posts', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
```