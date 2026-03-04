const { Sequelize, DataTypes } = require('sequelize');
const { sequelize } = require('../config/config');

const UserModel = require('./user');
const ProductModel = require('./product');

const User = UserModel(sequelize, DataTypes);
const Product = ProductModel(sequelize, DataTypes);

// Define Associations
User.hasMany(Product, {
  foreignKey: 'userId',
  as: 'products',
  onDelete: 'CASCADE'
});
Product.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// You could add Order and OrderItem models here if expanding
// User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
// Order.belongsTo(User, { foreignKey: 'userId', as: 'customer' });
// Product.belongsToMany(Order, { through: 'OrderItem' });
// Order.belongsToMany(Product, { through: 'OrderItem' });

module.exports = {
  sequelize,
  User,
  Product
};