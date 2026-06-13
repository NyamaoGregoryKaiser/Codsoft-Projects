const { User } = require('../models');
const { generateToken } = require('../utils/jwt');
const { ApiError } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user.
 * @param {object} userData - User registration data (username, email, password).
 * @returns {object} - Registered user data and token.
 * @throws {ApiError} 400 if user with email/username already exists.
 */
const registerUser = async (userData) => {
  const { username, email, password, role } = userData;

  const existingUser = await User.findOne({
    where: {
      [User.sequelize.Op.or]: [{ email: email }, { username: username }],
    },
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw new ApiError(400, 'User with this email already exists.');
    }
    if (existingUser.username === username) {
      throw new ApiError(400, 'User with this username already exists.');
    }
  }

  const user = await User.create({ username, email, password, role });
  const token = generateToken(user);

  logger.info(`New user registered: ${user.email} with role ${user.role}`);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Log in a user.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {object} - Logged in user data and token.
 * @throws {ApiError} 401 if invalid credentials.
 */
const loginUser = async (email, password) => {
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.validPassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  // Update last login time
  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user);

  logger.info(`User logged in: ${user.email}`);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  };
};

/**
 * Get user profile by ID.
 * @param {string} userId - ID of the user.
 * @returns {object} - User profile data.
 * @throws {ApiError} 404 if user not found.
 */
const getUserProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'email', 'role', 'status', 'createdAt', 'updatedAt', 'lastLogin'],
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return user;
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};