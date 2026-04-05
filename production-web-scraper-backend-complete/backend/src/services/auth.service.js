const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const userService = require('./user.service');
const { generateAuthTokens } = require('../utils/jwt');
const logger = require('../utils/logger');

/**
 * Register a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const registerUser = async (userBody) => {
  if (await userService.getUserByEmail(userBody.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  return userService.createUser(userBody);
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Generate auth tokens for user
 * @param {User} user
 * @returns {Promise<Object>}
 */
const createAuthTokens = async (user) => {
  return generateAuthTokens(user);
};

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  createAuthTokens,
};