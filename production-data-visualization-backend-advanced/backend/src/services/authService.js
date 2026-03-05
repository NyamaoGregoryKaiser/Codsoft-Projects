const jwt = require('jsonwebtoken');
const User = require('../models/user');
const AppError = require('../utils/AppError');
const config = require('../config/config');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });
};

exports.registerUser = async (username, email, password, role = 'user') => {
  const newUser = await User.create({
    username,
    email,
    password,
    role,
  });

  const token = signToken(newUser.id);
  // Remove password from output
  newUser.password = undefined;
  return { user: newUser, token };
};

exports.loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(user.id);
  // Remove password from output
  user.password = undefined;
  return { user, token };
};