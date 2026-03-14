```javascript
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs'); // Assuming you want to hash passwords
const moment = require('moment');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // Each user belongs to one Role
      User.belongsTo(models.Role, { foreignKey: 'roleId', as: 'Role' });
      // A user can author multiple content items
      User.hasMany(models.ContentItem, { foreignKey: 'authorId', as: 'AuthoredContent' });
      // A user can also update content items (optional)
      User.hasMany(models.ContentItem, { foreignKey: 'updatedBy', as: 'UpdatedContent' });
      // A user can upload multiple media files
      User.hasMany(models.Media, { foreignKey: 'uploadedBy', as: 'UploadedMedia' });
    }

    /**
     * Compare the given password with the user's hashed password.
     * @param {string} candidatePassword
     * @returns {Promise<boolean>}
     */
    async comparePassword(candidatePassword) {
      return bcrypt.compare(candidatePassword, this.password);
    }

    /**
     * Instance method to get user's public profile (without sensitive info)
     * @returns {object}
     */
    getPublicProfile() {
      return {
        id: this.id,
        username: this.username,
        email: this.email,
        roleId: this.roleId,
        createdAt: moment(this.createdAt).toISOString(),
        updatedAt: moment(this.updatedAt).toISOString(),
      };
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Username cannot be empty.' },
        len: { args: [3, 30], msg: 'Username must be between 3 and 30 characters.' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Email cannot be empty.' },
        isEmail: { msg: 'Must be a valid email address.' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password cannot be empty.' },
        // Strong password regex should ideally be handled at input validation (Joi)
        // and only check for presence here. Length check can remain.
        len: { args: [8], msg: 'Password must be at least 8 characters long.' },
      },
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true, // Can be null if default role isn't assigned immediately
      references: {
        model: 'Roles', // 'Roles' refers to table name
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL', // If a role is deleted, users with that role will have roleId set to null
    },
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users',
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user, options) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    scopes: {
      // Define a scope to exclude sensitive data by default
      public: {
        attributes: { exclude: ['password'] }
      }
    }
  });

  return User;
};
```