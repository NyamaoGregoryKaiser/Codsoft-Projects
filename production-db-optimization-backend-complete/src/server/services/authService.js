const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userService = require('./userService');
const { APIError } = require('../utils/apiError');
const logger = require('../utils/logger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });
};

const registerUser = async (username, email, password, role = 'user') => {
  if (!username || !email || !password) {
    throw new APIError('Please enter all fields', 400);
  }

  const existingUser = await userService.findUserByEmail(email);
  if (existingUser) {
    throw new APIError('User with that email already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userService.createUser(username, email, hashedPassword, role);
  logger.info(`User registered: ${user.email}`);
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  };
};

const loginUser = async (email, password) => {
  const user = await userService.findUserByEmail(email);
  if (!user) {
    throw new APIError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new APIError('Invalid credentials', 401);
  }
  logger.info(`User logged in: ${user.email}`);
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    token: generateToken(user.id),
  };
};

module.exports = {
  registerUser,
  loginUser,
  generateToken,
};