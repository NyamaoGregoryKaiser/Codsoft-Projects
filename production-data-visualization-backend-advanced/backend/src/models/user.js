const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
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
      notEmpty: { msg: 'Username cannot be empty.' },
      len: { args: [3, 30], msg: 'Username must be between 3 and 30 characters.' },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: { msg: 'Please provide a valid email address.' },
      notEmpty: { msg: 'Email cannot be empty.' },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: { args: [8, 100], msg: 'Password must be at least 8 characters long.' },
      notEmpty: { msg: 'Password cannot be empty.' },
    },
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
    allowNull: false,
  },
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    },
  },
});

User.prototype.correctPassword = async function (candidatePassword, userPassword) {
  return bcrypt.compare(candidatePassword, userPassword);
};

module.exports = User;