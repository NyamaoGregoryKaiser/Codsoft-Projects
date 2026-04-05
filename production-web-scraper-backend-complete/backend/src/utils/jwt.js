const jwt = require('jsonwebtoken');
const moment = require('moment');
const { jwt: jwtConfig } = require('../config');

/**
 * Generate JWT token
 * @param {string} userId
 * @param {moment.Moment} expires
 * @param {string} secret
 * @returns {string}
 */
const generateToken = (userId, expires, secret = jwtConfig.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
  };
  return jwt.sign(payload, secret);
};

/**
 * Verify token
 * @param {string} token
 * @param {string} secret
 * @returns {Object}
 */
const verifyToken = (token, secret = jwtConfig.secret) => {
  return jwt.verify(token, secret);
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Object}
 */
const generateAuthTokens = (user) => {
  const accessTokenExpires = moment().add(jwtConfig.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires);

  // For simplicity, we won't use refresh tokens for this project,
  // but this is where you'd generate and save it.
  // const refreshTokenExpires = moment().add(jwtConfig.refreshExpirationDays, 'days');
  // const refreshToken = generateToken(user.id, refreshTokenExpires);

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    // refresh: {
    //   token: refreshToken,
    //   expires: refreshTokenExpires.toDate(),
    // },
  };
};

module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
};