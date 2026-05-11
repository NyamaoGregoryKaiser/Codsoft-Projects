module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Post title cannot be empty.' },
        len: { args: [5, 255], msg: 'Title must be between 5 and 255 characters.' }
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Post slug cannot be empty.' },
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i // Slug format
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Post content cannot be empty.' },
        len: { args: [10, 100000], msg: 'Content must be between 10 and 100,000 characters.' }
      }
    },
    excerpt: {
      type: DataTypes.STRING(500), // Shorter summary
      allowNull: true,
      validate: {
        len: { args: [0, 500], msg: 'Excerpt cannot exceed 500 characters.' }
      }
    },
    status: {
      type: DataTypes.ENUM('draft', 'published', 'archived'),
      defaultValue: 'draft',
      allowNull: false
    },
    featuredImage: {
      type: DataTypes.STRING, // URL to image
      allowNull: true,
      validate: {
        isUrl: { msg: 'Featured image must be a valid URL.' }
      }
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // Name of the User table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL' // Or 'RESTRICT' based on business logic
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true, // Posts can optionally have categories
      references: {
        model: 'categories', // Name of the Category table
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    }
  }, {
    tableName: 'posts',
    timestamps: true,
    hooks: {
      beforeValidate: (post, options) => {
        if (post.title && !post.slug) {
          post.slug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        }
        if (post.status === 'published' && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }
    },
    indexes: [
      {
        unique: true,
        fields: ['slug']
      },
      {
        fields: ['authorId']
      },
      {
        fields: ['categoryId']
      },
      {
        fields: ['status']
      },
      {
        fields: ['publishedAt']
      }
    ]
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, {
      foreignKey: 'authorId',
      as: 'author'
    });
    Post.belongsTo(models.Category, {
      foreignKey: 'categoryId',
      as: 'category'
    });
  };

  return Post;
};
```