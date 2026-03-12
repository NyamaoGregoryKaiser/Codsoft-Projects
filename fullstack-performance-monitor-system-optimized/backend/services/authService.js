```javascript
const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Registers a new user.
 * @param {object} userData - User registration data (username, email, password).
 * @returns {object} - User object and JWT token.
 * @throws {Error} If user already exists or validation fails.
 */
const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Basic validation
  if (!username || !email || !password) {
    throw new Error('Username, email, and password are required.');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  try {
    const newUser = await User.create({
      username,
      email,
      passwordHash: password, // passwordHash will be hashed by model hook
    });

    const token = generateToken({ id: newUser.id });
    logger.info(`User registered successfully: ${newUser.email}`);
    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
      },
      token,
    };
  } catch (error) {
    logger.error('Error during user registration:', error.message, error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new Error('Username or email already in use.');
    }
    throw new Error(`Registration failed: ${error.message}`);
  }
};

/**
 * Logs in a user.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {object} - User object and JWT token.
 * @throws {Error} If credentials are invalid.
 */
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new Error('Invalid credentials.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials.');
  }

  const token = generateToken({ id: user.id });
  logger.info(`User logged in successfully: ${user.email}`);
  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
    token,
  };
};

module.exports = {
  registerUser,
  loginUser,
};
```