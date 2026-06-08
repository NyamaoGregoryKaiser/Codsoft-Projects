const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('draft', 'published', 'archived'),
    defaultValue: 'draft',
  },
  publishedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  authorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users', // 'Users' refers to table name
      key: 'id',
    }
  },
  // categoryId will be added via association
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (post) => {
      if (!post.slug && post.title) {
        post.slug = post.title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
          .replace(/[\s_-]+/g, '-')     // Replace spaces and underscores with single dash
          .replace(/^-+|-+$/g, '');     // Trim dashes from start/end
      }
    },
    beforeUpdate: (post) => {
      if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
        post.publishedAt = new Date();
      }
    }
  }
});

module.exports = Post;