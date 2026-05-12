```javascript
const httpStatus = require('http-status-codes');
const jwt = require('jsonwebtoken');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');
const userService = require('./user.service');
const logger = require('../utils/logger');

/**
 * Generate JWT tokens for user
 * @param {User} user
 * @returns {Object}
 */
const generateAuthTokens = (user) => {
  const accessTokenExpires = Math.floor(Date.now() / 1000) + config.jwt.accessExpirationMinutes * 60;
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, iat: Math.floor(Date.now() / 1000), exp: accessTokenExpires },
    config.jwt.secret
  );

  const refreshTokenExpires = Math.floor(Date.now() / 1000) + config.jwt.refreshExpirationDays * 24 * 60 * 60;
  const refreshToken = jwt.sign(
    { sub: user.id, exp: refreshTokenExpires },
    config.jwt.secret
  );

  return {
    access: {
      token: accessToken,
      expires: new Date(accessTokenExpires * 1000),
    },
    refresh: {
      token: refreshToken,
      expires: new Date(refreshTokenExpires * 1000),
    },
  };
};

/**
 * Register a user
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const registerUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) { // Example of custom model method
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  if (await User.isUsernameTaken(userBody.username)) { // Example of custom model method
    throw new ApiError(httpStatus.BAD_REQUEST, 'Username already taken');
  }
  const user = await User.create(userBody);
  return user;
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.findOne({ where: { email } });
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Refresh auth tokens
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshAuthTokens = async (refreshToken) => {
  try {
    const payload = jwt.verify(refreshToken, config.jwt.secret);
    const user = await User.findByPk(payload.sub);
    if (!user) {
      throw new Error();
    }
    return generateAuthTokens(user);
  } catch (error) {
    logger.error('Refresh token failed:', error.message);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

module.exports = {
  generateAuthTokens,
  registerUser,
  loginUserWithEmailAndPassword,
  refreshAuthTokens,
};
```