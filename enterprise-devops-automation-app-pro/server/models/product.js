const { DataTypes } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Product name cannot be empty.' },
        len: { args: [3, 100], msg: 'Product name must be between 3 and 100 characters.' }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: { msg: 'Price must be a decimal number.' },
        min: { args: [0], msg: 'Price cannot be negative.' }
      }
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isInt: { msg: 'Stock must be an integer.' },
        min: { args: [0], msg: 'Stock cannot be negative.' }
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: { msg: 'Image URL must be a valid URL.' }
      }
    }
    // userId is added automatically by the association in models/index.js
  }, {
    tableName: 'products',
    timestamps: true
  });

  return Product;
};