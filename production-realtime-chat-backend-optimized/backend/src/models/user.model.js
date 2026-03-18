```javascript
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
          notEmpty: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [6, 255], // Minimum password length
        },
      },
      role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
      },
    }
  );

  /**
   * Check if password matches the user's password
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  User.prototype.isPasswordMatch = async function (password) {
    return bcrypt.compare(password, this.password);
  };

  /**
   * Check if email is already taken
   * @param {string} email
   * @param {UUID} [excludeUserId]
   * @returns {Promise<boolean>}
   */
  User.isEmailTaken = async function (email, excludeUserId) {
    const user = await this.findOne({ where: { email, id: { [DataTypes.Op.ne]: excludeUserId } } });
    return !!user;
  };

  /**
   * Check if username is already taken
   * @param {string} username
   * @param {UUID} [excludeUserId]
   * @returns {Promise<boolean>}
   */
  User.isUsernameTaken = async function (username, excludeUserId) {
    const user = await this.findOne({ where: { username, id: { [DataTypes.Op.ne]: excludeUserId } } });
    return !!user;
  };

  return User;
};
```