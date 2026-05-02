```javascript
const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const logger = require('../utils/logger');

const User = require('./user')(sequelize, DataTypes);
const Product = require('./product')(sequelize, DataTypes);

// Define associations
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Product.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

const db = {
  sequelize,
  Sequelize,
  User,
  Product,
};

module.exports = db;
```