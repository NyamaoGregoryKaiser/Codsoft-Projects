```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/config');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hashedPassword = await bcrypt.hash(config.admin.password, 10);
    const adminId = uuidv4();

    await queryInterface.bulkInsert('users', [{
      id: adminId,
      username: config.admin.username,
      email: config.admin.email,
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true }); // Prevent re-insertion if already exists

    // Example of seeding a default ContentType (e.g., "Page")
    const pageContentTypeId = uuidv4();
    await queryInterface.bulkInsert('content_types', [{
      id: pageContentTypeId,
      name: 'Page',
      slug: 'page',
      description: 'A standard website page.',
      fields: JSON.stringify([
        { name: 'title', label: 'Page Title', type: 'text', required: true, unique: true },
        { name: 'slug', label: 'Page Slug', type: 'text', required: true, unique: true },
        { name: 'content', label: 'Main Content', type: 'richtext', required: false },
        { name: 'metaDescription', label: 'Meta Description', type: 'text', required: false },
        { name: 'publishedDate', label: 'Published Date', type: 'date', required: false },
        { name: 'author', label: 'Author', type: 'relation', targetContentType: 'user' }, // Assuming 'user' is a virtual content type or direct relation
      ]),
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });

    // Example of seeding a default Entry for "Page"
    await queryInterface.bulkInsert('entries', [{
      id: uuidv4(),
      contentTypeId: pageContentTypeId,
      userId: adminId,
      status: 'published',
      data: JSON.stringify({
        title: 'Welcome to NimbusCMS!',
        slug: 'welcome',
        content: '<p>This is your first page content. You can edit it or create new content types and entries.</p>',
        metaDescription: 'Welcome page for the Nimbus CMS.',
        publishedDate: new Date().toISOString().split('T')[0],
      }),
      createdAt: new Date(),
      updatedAt: new Date()
    }], { ignoreDuplicates: true });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('entries', null, {});
    await queryInterface.bulkDelete('content_types', null, {});
    await queryInterface.bulkDelete('users', { email: config.admin.email }, {});
  }
};
```