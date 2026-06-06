```javascript
const httpStatus = require('http-status');
const bcrypt = require('bcryptjs');
const { verifyToken, generateAuthTokens } = require('../../config/jwt');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

/**
 * Log in with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
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
    const payload = verifyToken(refreshToken);
    if (payload.type !== 'refresh') {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid refresh token type');
    }

    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found or refresh token invalid');
    }

    // Optionally, implement refresh token blacklist/storage to prevent reuse
    // For simplicity, we assume refresh tokens are single-use or have a short window
    // if not stored in DB. If stored, you would invalidate the old token here.

    return generateAuthTokens(user);
  } catch (error) {
    logger.error('Error refreshing tokens:', error.message);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired refresh token');
  }
};

module.exports = {
  loginUserWithEmailAndPassword,
  refreshAuthTokens,
};
```