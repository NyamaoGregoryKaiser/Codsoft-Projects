```javascript
'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Create Roles
      const adminRoleId = uuidv4();
      const authorRoleId = uuidv4();
      const editorRoleId = uuidv4();

      await queryInterface.bulkInsert('Roles', [
        {
          id: adminRoleId,
          name: 'Admin',
          description: 'Administrator with full system access',
          slug: 'admin',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: authorRoleId,
          name: 'Author',
          description: 'Can create and manage own content, upload media',
          slug: 'author',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: editorRoleId,
          name: 'Editor',
          description: 'Can create, manage, and publish all content, manage media',
          slug: 'editor',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], { transaction });

      // 2. Create Permissions
      const permissionsData = [
        // User & Role Management
        { name: 'Read Users', slug: 'read_users', description: 'View user profiles' },
        { name: 'Manage Users', slug: 'manage_users', description: 'Create, update, delete users' },
        { name: 'Read Roles', slug: 'read_roles', description: 'View roles' },
        { name: 'Manage Roles', slug: 'manage_roles', description: 'Create, update, delete roles and assign permissions' },
        { name: 'Read Permissions', slug: 'read_permissions', description: 'View permissions' },

        // Content Type Management
        { name: 'Manage Content Types', slug: 'manage_content_types', description: 'Create, update, delete content types and their schemas' },

        // Content Item Management
        { name: 'Read Content Items', slug: 'read_content_items', description: 'View all content items' },
        { name: 'Create Content Items', slug: 'create_content_items', description: 'Create new content items' },
        { name: 'Update Content Items', slug: 'update_content_items', description: 'Update any content item' },
        { name: 'Delete Content Items', slug: 'delete_content_items', description: 'Delete any content item' },
        { name: 'Publish Content Items', slug: 'publish_content_items', description: 'Change content item status to published' },
        { name: 'Edit Own Content Items', slug: 'edit_own_content_items', description: 'Update content items authored by self' },
        { name: 'Delete Own Content Items', slug: 'delete_own_content_items', description: 'Delete content items authored by self' },

        // Media Management
        { name: 'Read Media', slug: 'read_media', description: 'View all media files' },
        { name: 'Upload Media', slug: 'upload_media', description: 'Upload new media files' },
        { name: 'Manage Media', slug: 'manage_media', description: 'Update, delete any media file' },

        // System Settings
        { name: 'Manage Settings', slug: 'manage_settings', description: 'Access and modify system-wide settings' },
      ];

      const createdPermissions = await queryInterface.bulkInsert('Permissions', permissionsData.map(p => ({
        id: uuidv4(),
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      })), { returning: true, transaction });

      const getPermissionId = (slug) => createdPermissions.find(p => p.slug === slug).id;

      // 3. Assign Permissions to Roles (RolePermissions)
      const rolePermissions = [];

      // Admin role gets all permissions
      createdPermissions.forEach(permission => {
        rolePermissions.push({
          roleId: adminRoleId,
          permissionId: permission.id,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Editor role permissions
      const editorPermSlugs = [
        'read_users', 'read_roles', 'read_permissions',
        'manage_content_types',
        'read_content_items', 'create_content_items', 'update_content_items', 'delete_content_items', 'publish_content_items',
        'read_media', 'upload_media', 'manage_media',
      ];
      editorPermSlugs.forEach(slug => {
        rolePermissions.push({
          roleId: editorRoleId,
          permissionId: getPermissionId(slug),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      // Author role permissions
      const authorPermSlugs = [
        'read_content_items', 'create_content_items', 'edit_own_content_items', 'delete_own_content_items',
        'read_media', 'upload_media',
      ];
      authorPermSlugs.forEach(slug => {
        rolePermissions.push({
          roleId: authorRoleId,
          permissionId: getPermissionId(slug),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });

      await queryInterface.bulkInsert('RolePermissions', rolePermissions, { transaction });

      // 4. Create an Admin User
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const adminUserId = uuidv4();

      await queryInterface.bulkInsert('Users', [
        {
          id: adminUserId,
          username: 'admin',
          email: 'admin@example.com',
          password: hashedPassword,
          roleId: adminRoleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'author_user',
          email: 'author@example.com',
          password: await bcrypt.hash('Author@123', 10),
          roleId: authorRoleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          username: 'editor_user',
          email: 'editor@example.com',
          password: await bcrypt.hash('Editor@123', 10),
          roleId: editorRoleId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], { transaction });

      // 5. Create some initial Content Types
      const postContentTypeId = uuidv4();
      const pageContentTypeId = uuidv4();

      await queryInterface.bulkInsert('ContentTypes', [
        {
          id: postContentTypeId,
          name: 'Post',
          slug: 'post',
          description: 'A blog post with title, content, and tags.',
          fields: JSON.stringify([
            { name: 'title', label: 'Title', type: 'string', required: true },
            { name: 'slug', label: 'URL Slug', type: 'string', required: true },
            { name: 'excerpt', label: 'Excerpt', type: 'text', required: false },
            { name: 'content', label: 'Content', type: 'text', required: true },
            { name: 'featuredImage', label: 'Featured Image', type: 'media', required: false },
            { name: 'tags', label: 'Tags', type: 'json', required: false, defaultValue: [] }, // Array of strings
            { name: 'category', label: 'Category', type: 'string', required: false },
          ]),
          isPublishable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: pageContentTypeId,
          name: 'Page',
          slug: 'page',
          description: 'A static page for website content.',
          fields: JSON.stringify([
            { name: 'title', label: 'Page Title', type: 'string', required: true },
            { name: 'slug', label: 'Page Slug', type: 'string', required: true },
            { name: 'body', label: 'Page Body', type: 'text', required: true },
            { name: 'template', label: 'Page Template', type: 'string', required: false, defaultValue: 'default' },
          ]),
          isPublishable: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], { transaction });

      // 6. Create some initial Content Items
      await queryInterface.bulkInsert('ContentItems', [
        {
          id: uuidv4(),
          contentTypeId: postContentTypeId,
          data: JSON.stringify({
            title: 'First Blog Post',
            slug: 'first-blog-post',
            excerpt: 'This is the first blog post created by the admin user.',
            content: '<p>Welcome to our new CMS! This is an example of a blog post content.</p><p>It demonstrates how rich text content might be stored and rendered.</p>',
            tags: ['welcome', 'first-post'],
            category: 'Announcements',
          }),
          status: 'published',
          authorId: adminUserId,
          updatedBy: adminUserId,
          publishedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: uuidv4(),
          contentTypeId: pageContentTypeId,
          data: JSON.stringify({
            title: 'About Us',
            slug: 'about-us',
            body: '<p>This is an about us page. You can customize this content to tell your story.</p>',
            template: 'full-width',
          }),
          status: 'draft', // Example of a draft page
          authorId: adminUserId,
          updatedBy: adminUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ], { transaction });

      await transaction.commit();
      console.log('Seed data inserted successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Seed data insertion failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('ContentItems', null, { transaction });
      await queryInterface.bulkDelete('ContentTypes', null, { transaction });
      await queryInterface.bulkDelete('Users', null, { transaction });
      await queryInterface.bulkDelete('RolePermissions', null, { transaction });
      await queryInterface.bulkDelete('Permissions', null, { transaction });
      await queryInterface.bulkDelete('Roles', null, { transaction });
      await transaction.commit();
      console.log('Seed data deleted successfully!');
    } catch (error) {
      await transaction.rollback();
      console.error('Seed data deletion failed:', error);
      throw error;
    }
  },
};
```