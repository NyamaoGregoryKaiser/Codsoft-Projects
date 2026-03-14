```javascript
const { Model } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
  class Permission extends Model {
    static associate(models) {
      // A Permission can belong to many Roles through a junction table (RolePermissions)
      Permission.belongsToMany(models.Role, {
        through: 'RolePermissions',
        foreignKey: 'permissionId',
        as: 'Roles'
      });
    }
  }

  Permission.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Permission name cannot be empty.' },
        len: { args: [2, 100], msg: 'Permission name must be between 2 and 100 characters.' },
      },
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    slug: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Permission',
    tableName: 'Permissions',
    timestamps: true,
    hooks: {
      beforeValidate: (permission) => {
        if (permission.name) {
          permission.slug = slugify(permission.name, { lower: true, strict: true });
        }
      },
    },
  });

  return Permission;
};
```