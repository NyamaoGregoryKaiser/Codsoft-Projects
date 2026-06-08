const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
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
    validate: {
      min: 8,
    },
    private: true, // used to hide password in toJSON
  },
  role: {
    type: DataTypes.ENUM('user', 'editor', 'admin'),
    defaultValue: 'user',
  },
}, {
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
  defaultScope: {
    attributes: { exclude: ['password'] } // Exclude password from default queries
  },
  scopes: {
    withPassword: {
      attributes: {} // Include password
    }
  }
});

/**
 * Check if email is taken
 * @param {string} email
 * @param {UUID} [excludeUserId]
 * @returns {Promise<boolean>}
 */
User.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ where: { email, id: { [DataTypes.Op.ne]: excludeUserId } } });
  return !!user;
};

/**
 * Check if password matches
 * @param {string} password
 * @returns {Promise<boolean>}
 */
User.prototype.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = User;