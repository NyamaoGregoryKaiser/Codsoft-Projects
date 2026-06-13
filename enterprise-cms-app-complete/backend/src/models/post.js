module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Post title cannot be empty.' },
        len: { args: [5, 255], msg: 'Title must be between 5 and 255 characters.' },
      },
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Slug cannot be empty.' },
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/, // slug format
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Post content cannot be empty.' },
      },
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
    featuredImageId: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
    },
  }, {
    tableName: 'posts',
    timestamps: true,
    hooks: {
      beforeValidate: (post) => {
        if (!post.slug && post.title) {
          post.slug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
            .trim()
            .replace(/\s+/g, '-'); // Replace spaces with hyphens
        }
      },
      beforeUpdate: (post) => {
        if (post.changed('title') && post.title && !post.changed('slug')) {
          post.slug = post.title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .trim()
            .replace(/\s+/g, '-');
        }
      },
      beforeCreate: (post) => {
        if (post.status === 'published' && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      },
      beforeUpdate: (post) => {
        if (post.changed('status') && post.status === 'published' && !post.publishedAt) {
          post.publishedAt = new Date();
        }
      }
    },
  });

  Post.associate = (models) => {
    Post.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
    Post.belongsTo(models.Category, { foreignKey: 'categoryId', as: 'category' });
    Post.belongsTo(models.Media, { foreignKey: 'featuredImageId', as: 'featuredImage' });
    // Add many-to-many for Tags if implementing tags
  };

  return Post;
};