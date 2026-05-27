```javascript
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
        allowNull: false,
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
      tableName: 'categories',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeValidate: (category, options) => {
          if (category.name && !category.slug) {
            category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
          }
        },
      },
    }
  );

  Category.associate = (models) => {
    Category.hasMany(models.Post, {
      foreignKey: 'categoryId',
      as: 'posts',
      onDelete: 'SET NULL', // Posts categoryId becomes null if category is deleted
    });
  };

  return Category;
};
```