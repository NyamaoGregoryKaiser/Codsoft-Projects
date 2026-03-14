```javascript
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/winston');

/**
 * Register a new user.
 * @param {string} username
 * @param {string} email
 * @param {string} password
 * @returns {User} The created user object
 * @throws {ErrorResponse} If user already exists or validation fails
 */
exports.registerUser = async (username, email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn(`Attempted registration with existing email: ${email}`);
    throw new ErrorResponse('User with that email already exists', 400);
  }

  const user = await User.create({
    username,
    email,
    password
  });

  logger.info(`User registered successfully: ${user.email}`);
  return user;
};

/**
 * Log in a user.
 * @param {string} email
 * @param {string} password
 * @returns {User} The authenticated user object
 * @throws {ErrorResponse} If credentials are invalid
 */
exports.loginUser = async (email, password) => {
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    logger.warn(`Login attempt with invalid email: ${email}`);
    throw new ErrorResponse('Invalid credentials', 401);
  }

  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    logger.warn(`Login attempt with incorrect password for email: ${email}`);
    throw new ErrorResponse('Invalid credentials', 401);
  }

  logger.info(`User logged in successfully: ${user.email}`);
  return user;
};

/**
 * Get current authenticated user details.
 * @param {string} userId
 * @returns {User} The user object without password
 * @throws {ErrorResponse} If user is not found
 */
exports.getMe = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'rooms',
    select: 'name isPrivate'
  });

  if (!user) {
    logger.error(`User not found for ID: ${userId} in getMe service`);
    throw new ErrorResponse('User not found', 404);
  }

  return user;
};
```