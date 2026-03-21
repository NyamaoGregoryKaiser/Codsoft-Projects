const bcrypt = require('bcryptjs');
const { generateAuthTokens } = require('../utils/jwt');
const config = require('../config');
const knex = require('../database/knexfile');
const logger = require('../utils/logger');

const registerUser = async (userData) => {
  const { name, email, password } = userData;

  const existingUser = await knex('users').where({ email }).first();
  if (existingUser) {
    throw new Error('Email already taken.');
  }

  const hashedPassword = await bcrypt.hash(password, config.BCRYPT_SALT_ROUNDS);

  const [userId] = await knex('users')
    .insert({
      name,
      email,
      password: hashedPassword,
      role: 'user', // Default role
    })
    .returning('id');

  const tokens = await generateAuthTokens(userId, 'user');

  return { userId, tokens };
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await knex('users').where({ email }).first();

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error('Incorrect email or password.');
  }

  const tokens = await generateAuthTokens(user.id, user.role);

  return { user, tokens };
};

const refreshAuthTokens = async (refreshToken) => {
  try {
    const { sub: userId, type } = await require('../utils/jwt').verifyToken(refreshToken, config.JWT_SECRET);

    if (type !== 'refresh') {
      throw new Error('Invalid refresh token.');
    }

    const user = await knex('users').where({ id: userId }).first();
    if (!user) {
      throw new Error('User not found.');
    }

    // You might want to store refresh tokens in DB and invalidate them here
    // For simplicity, we just regenerate if the token is valid

    const tokens = await generateAuthTokens(user.id, user.role);
    return tokens;
  } catch (error) {
    logger.error('Error refreshing token:', error);
    throw new Error('Please authenticate');
  }
};

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  refreshAuthTokens,
};