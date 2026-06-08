const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    trim: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
  hooks: {
    beforeValidate: (category) => {
      if (!category.slug && category.name) {
        category.slug = category.name
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
    },
  }
});

module.exports = Category;