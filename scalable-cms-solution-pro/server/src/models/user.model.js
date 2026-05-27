```javascript
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: () => uuidv4(),
        primaryKey: true,
        allowNull: false,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        trim: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        trim: true,
        lowercase: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        private: true, // used to hide the password field from responses
        validate: {
          len: [6, 255], // minimum 6 characters
        },
      },
      role: {
        type: DataTypes.ENUM('user', 'author', 'editor', 'admin'),
        defaultValue: 'user',
        allowNull: false,
      },
      isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
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
      tableName: 'users',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] },
        },
      },
      defaultScope: {
        attributes: { exclude: ['password'] }, // Exclude password by default
      },
    }
  );

  /**
   * Check if email is taken
   * @param {string} email
   * @param {string} [excludeUserId] - The user's ID to exclude from the check (for update operations)
   * @returns {Promise<boolean>}
   */
  User.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ where: { email } });
    return !!user && user.id !== excludeUserId;
  };

  /**
   * Check if username is taken
   * @param {string} username
   * @param {string} [excludeUserId] - The user's ID to exclude from the check
   * @returns {Promise<boolean>}
   */
  User.isUsernameTaken = async function (username, excludeUserId) {
    const user = await this.findOne({ where: { username } });
    return !!user && user.id !== excludeUserId;
  };

  User.associate = (models) => {
    User.hasMany(models.Post, {
      foreignKey: 'authorId',
      as: 'posts',
      onDelete: 'SET NULL', // Posts authorId becomes null if user is deleted
    });
    User.hasMany(models.Media, {
      foreignKey: 'uploadedBy',
      as: 'uploadedMedia',
      onDelete: 'SET NULL', // Media uploadedBy becomes null if user is deleted
    });
  };

  return User;
};
```