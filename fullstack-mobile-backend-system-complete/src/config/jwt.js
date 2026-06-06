```javascript
const jwt = require('jsonwebtoken');
const moment = require('moment');
const config = require('./index');
const logger = require('../utils/logger');

/**
 * Generate token
 * @param {string} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Verify token
 * @param {string} token
 * @param {string} [secret]
 * @returns {Object}
 */
const verifyToken = (token, secret = config.jwt.secret) => {
  try {
    const payload = jwt.verify(token, secret);
    return payload;
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    throw error;
  }
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Object}
 */
const generateAuthTokens = (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, 'access');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, 'refresh');

  return {
    accessToken,
    refreshToken,
    accessExpires: accessTokenExpires.toDate(),
    refreshExpires: refreshTokenExpires.toDate(),
  };
};

module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
};
```