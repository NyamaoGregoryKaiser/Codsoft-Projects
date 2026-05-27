```javascript
const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Generate auth token
 * @param {User} user
 * @returns {string}
 */
const generateAuthToken = async (user) => {
  const payload = { id: user.id, role: user.role };
  const token = jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRATION_MINUTES * 60, // in seconds
  });
  return token;
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

module.exports = {
  generateAuthToken,
  loginUserWithEmailAndPassword,
};
```