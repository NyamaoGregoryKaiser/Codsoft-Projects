'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('posts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      excerpt: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull: false
      },
      featuredImage: {
        type: Sequelize.STRING,
        allowNull: true
      },
      publishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      authorId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users', // table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Keep posts if author deleted, but authorId becomes null
      },
      categoryId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'categories', // table name
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL' // Remove category link if category deleted
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('posts', ['slug'], { unique: true });
    await queryInterface.addIndex('posts', ['authorId']);
    await queryInterface.addIndex('posts', ['categoryId']);
    await queryInterface.addIndex('posts', ['status']);
    await queryInterface.addIndex('posts', ['publishedAt']);
    await queryInterface.addIndex('posts', ['title', 'content'], {
      name: 'posts_title_content_idx',
      using: 'GIN', // For full-text search capabilities in PostgreSQL
      operator: 'gin_trgm_ops', // Requires pg_trgm extension
      fields: ['title', 'content']
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('posts');
    // Drop the enum if explicitly created
    // await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_posts_status";');
  }
};
```