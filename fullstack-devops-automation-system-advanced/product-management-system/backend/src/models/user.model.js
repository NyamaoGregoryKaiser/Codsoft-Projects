'use strict';
const { Model } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      User.hasMany(models.Product, {
        foreignKey: 'userId',
        as: 'products'
      });
    }

    /**
     * Compare the given password with the user's hashed password.
     * @param {string} password - The plain text password to compare.
     * @returns {Promise<boolean>} - True if passwords match, false otherwise.
     */
    async isPasswordMatch(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      private: true // Exclude password from query results by default
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'Users', // Explicitly specify table name
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 10);
        }
      }
    },
    // Default scope to exclude password from query results
    defaultScope: {
      attributes: { exclude: ['password'] }
    },
    // Scope to include password when specifically requested
    scopes: {
      withPassword: {
        attributes: { include: ['password'] }
      }
    }
  });

  return User;
};
```

```