const { User } = require('../models');
const jwtUtil = require('../utils/jwt');
const logger = require('../utils/logger');
const { Sequelize } = require('../models'); // Import Sequelize to catch specific errors

/**
 * Registers a new user.
 * @param {Object} userData - User data (username, email, password, role).
 * @returns {Object} - Registered user data and JWT token.
 * @throws {Error} If user creation fails due to validation or conflict.
 */
const register = async (userData) => {
  try {
    const { username, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Sequelize.Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      const error = new Error('User with this email or username already exists');
      error.statusCode = 409; // Conflict
      throw error;
    }

    const user = await User.create({ username, email, password, role });
    const token = jwtUtil.generateToken(user.id);

    logger.info(`User registered: ${user.email}`);

    // Exclude password from the returned user object
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
  } catch (error) {
    logger.error(`Error during user registration: ${error.message}`, { stack: error.stack, userData });
    throw error;
  }
};

/**
 * Authenticates a user and generates a JWT token.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @returns {Object} - Authenticated user data and JWT token.
 * @throws {Error} If authentication fails.
 */
const login = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401; // Unauthorized
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('User account is inactive. Please contact support.');
      error.statusCode = 403; // Forbidden
      throw error;
    }

    user.lastLogin = new Date();
    await user.save(); // Update last login time

    const token = jwtUtil.generateToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    // Exclude password from the returned user object
    const userResponse = user.toJSON();
    delete userResponse.password;

    return { user: userResponse, token };
  } catch (error) {
    logger.error(`Error during user login for email ${email}: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Retrieves the profile of an authenticated user.
 * @param {string} userId - ID of the authenticated user.
 * @returns {Object} - User profile data.
 * @throws {Error} If user is not found.
 */
const getProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] } // Exclude password from the result
    });

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404; // Not Found
      throw error;
    }

    return user;
  } catch (error) {
    logger.error(`Error retrieving user profile for ID ${userId}: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

module.exports = {
  register,
  login,
  getProfile,
};
```