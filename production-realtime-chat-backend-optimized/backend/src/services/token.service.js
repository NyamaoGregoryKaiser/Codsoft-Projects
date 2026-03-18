```javascript
const jwt = require('jsonwebtoken');
const moment = require('moment');
const httpStatus = require('http-status');
const config = require('../config/config');
const userService = require('./user.service');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');
// For a real app, you would store refresh tokens in DB or Redis.
// For simplicity, let's keep it in memory for this example (NOT for production).
// Or better: use Redis for short-lived refresh token storage or Blacklisting.

const TokenBlacklist = new Set(); // Simple in-memory blacklist for revoked tokens

/**
 * Generate token
 * @param {UUID} userId
 * @param {moment.Moment} expires
 * @param {string} type
 * @param {string} [secret=config.jwt.secret]
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
 * Save token - for refresh tokens in a real app
 * (For this example, we're not persisting refresh tokens, just generating and validating)
 * In a real application, refresh tokens would be stored securely in a database
 * and invalidated upon logout or when compromised.
 * For now, we'll simulate a persistent refresh token.
 * A more robust solution involves a Token model linked to users or storing in Redis.
 * This simplified example relies on the refresh token being self-contained JWT.
 */

/**
 * Verify token and return token payload (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Object>}
 */
const verifyToken = async (token, type) => {
  if (TokenBlacklist.has(token)) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Token blacklisted');
  }
  const payload = jwt.verify(token, config.jwt.secret);
  if (payload.type !== type) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
  }
  // In a real app, you'd check if the token exists in your DB for refresh tokens.
  // For access tokens, simply verification is usually enough.

  // Simulate refresh token persistence:
  if (type === 'refresh') {
    // Here you would check if this specific refresh token is still valid in your DB
    // and hasn't been used or revoked. For this example, we're just checking user existence.
    const user = await userService.getUserById(payload.sub);
    if (!user) {
      throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found for refresh token');
    }
    return { user: user.id, type: payload.type }; // Return user id and type
  }

  return payload;
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user) => {
  const accessTokenExpires = moment().add(config.jwt.accessExpirationMinutes, 'minutes');
  const accessToken = generateToken(user.id, accessTokenExpires, 'access');

  const refreshTokenExpires = moment().add(config.jwt.refreshExpirationDays, 'days');
  const refreshToken = generateToken(user.id, refreshTokenExpires, 'refresh');

  // In a real app, you'd store refreshToken (or its hash) in a DB/Redis linked to the user.
  // This allows for explicit revocation (e.g., on logout from all devices).
  // For this example, refresh tokens are self-contained and checked against user existence.
  // A simple blacklist for refresh tokens would be needed for logout.

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Add token to blacklist (e.g., on logout)
 * @param {string} token
 */
const blacklistToken = (token) => {
  TokenBlacklist.add(token);
  logger.info(`Token blacklisted: ${token}`);
};


module.exports = {
  generateToken,
  verifyToken,
  generateAuthTokens,
  blacklistToken,
};
```