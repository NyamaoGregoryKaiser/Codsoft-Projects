```javascript
const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

// Import models
const User = require('./user.model')(sequelize, DataTypes);
const Post = require('./post.model')(sequelize, DataTypes);
const Category = require('./category.model')(sequelize, DataTypes);
const Tag = require('./tag.model')(sequelize, DataTypes);

// Define associations
// User - Post: One-to-Many
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

// Category - Post: One-to-Many
Category.hasMany(Post, { foreignKey: 'categoryId', as: 'posts' });
Post.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

// Post - Tag: Many-to-Many
// Create a join table 'PostTags' implicitly
Post.belongsToMany(Tag, { through: 'PostTags', as: 'tags', foreignKey: 'postId' });
Tag.belongsToMany(Post, { through: 'PostTags', as: 'posts', foreignKey: 'tagId' });

const db = {
    sequelize,
    Sequelize,
    User,
    Post,
    Category,
    Tag,
};

// Log model associations
logger.info('Database models and associations defined.');

module.exports = db;
```