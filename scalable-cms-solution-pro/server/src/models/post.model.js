```javascript
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define(
    'Post',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
        allowNull: false,
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
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      featuredImage: {
        type: DataTypes.STRING, // Store path to the image
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('draft', 'published', 'archived'),
        defaultValue: 'draft',
        allowNull: false,
      },
      publishedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      authorId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null if author is deleted
        references: {
          model: 'users', // Refers to the 'users' table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      categoryId: {
        type: DataTypes.UUID,
        allowNull: true, // Can be null if category is deleted
        references: {
          model: 'categories', // Refers to the 'categories' table
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      // Timestamps
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'posts',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeValidate: (post, options) => {
          if (post.title && !post.slug) {
            post.slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
          }
          if (post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date();
          }
        },
        beforeUpdate: (post, options) => {
          if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
            post.publishedAt = new Date();
          }
        }
      }
    }
  );

  Post.associate = (models) => {
    Post.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author',
    });
    Post.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category',
    });
  };

  return Post;
};
```