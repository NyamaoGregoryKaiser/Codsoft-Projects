const sequelize = require('../config/sequelize');
const User = require('./user.model');
const Post = require('./post.model');
const Category = require('./category.model');
const Media = require('./media.model');

// Define Associations
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(Media, { foreignKey: 'userId', as: 'media' });
Media.belongsTo(User, { foreignKey: 'userId', as: 'uploader' });

// Add foreign key to Post model
Post.belongsTo(Media, { foreignKey: 'featuredImageId', as: 'featuredImage' });
Media.hasOne(Post, { foreignKey: 'featuredImageId' }); // Optional: if a media can only be featured image for one post

const db = {
  sequelize,
  User,
  Post,
  Category,
  Media,
};

module.exports = db;