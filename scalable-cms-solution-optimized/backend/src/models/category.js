module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Category name cannot be empty.' },
        len: { args: [2, 100], msg: 'Category name must be between 2 and 100 characters.' }
      }
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Category slug cannot be empty.' },
        is: /^[a-z0-9]+(?:-[a-z0-9]+)*$/i // Slug format
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'categories',
    timestamps: true,
    hooks: {
      beforeValidate: (category, options) => {
        if (category.name && !category.slug) {
          category.slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-*|-*$/g, '');
        }
      }
    }
  });

  Category.associate = (models) => {
    Category.hasMany(models.Post, {
      foreignKey: 'categoryId',
      as: 'posts'
    });
  };

  return Category;
};
```