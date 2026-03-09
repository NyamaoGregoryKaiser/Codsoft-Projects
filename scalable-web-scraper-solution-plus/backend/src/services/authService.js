```javascript
const { User } = require('../models');
const { generateToken } = require('../utils/helpers');
const logger = require('../utils/logger');

/**
 * Registers a new user.
 * @param {string} username - The user's username.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Object} User data and JWT token.
 * @throws {Error} If user already exists or registration fails.
 */
const registerUser = async (username, email, password) => {
  const userExists = await User.findOne({ where: { email } });

  if (userExists) {
    throw new Error('User already exists');
  }

  const user = await User.create({
    username,
    email,
    password,
  });

  if (user) {
    logger.info(`User registered: ${user.email}`);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    };
  } else {
    throw new Error('Invalid user data');
  }
};

/**
 * Authenticates a user and returns a token.
 * @param {string} email - The user's email.
 * @param {string} password - The user's password.
 * @returns {Object} User data and JWT token.
 * @throws {Error} If invalid credentials.
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (user && (await user.matchPassword(password))) {
    logger.info(`User logged in: ${user.email}`);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    };
  } else {
    throw new Error('Invalid email or password');
  }
};

/**
 * Retrieves a user by their ID.
 * @param {string} id - The user ID.
 * @returns {Object} User data.
 * @throws {Error} If user not found.
 */
const getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: { exclude: ['password'] }
  });

  if (!user) {
    throw new Error('User not found');
  }
  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserById,
};
```