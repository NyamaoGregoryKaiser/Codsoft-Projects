```javascript
const { Model } = require('sequelize');
const slugify = require('slugify');

module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    static associate(models) {
      // A Role has many Users
      Role.hasMany(models.User, { foreignKey: 'roleId', as: 'Users' });
      // A Role has many Permissions through a junction table (RolePermissions)
      Role.belongsToMany(models.Permission, {
        through: 'RolePermissions',
        foreignKey: 'roleId',
        as: 'Permissions'
      });
    }
  }

  Role.init({
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
        notEmpty: { msg: 'Role name cannot be empty.' },
        len: { args: [2, 50], msg: 'Role name must be between 2 and 50 characters.' },
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
    modelName: 'Role',
    tableName: 'Roles',
    timestamps: true,
    hooks: {
      beforeValidate: (role) => {
        if (role.name) {
          role.slug = slugify(role.name, { lower: true, strict: true });
        }
      },
    },
  });

  return Role;
};
```