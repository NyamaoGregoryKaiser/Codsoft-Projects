const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('./logger');

/**
 * Generates a JSON Web Token (JWT) for a given user.
 * @param {object} user - The user object to encode in the token.
 * @returns {string} The generated JWT.
 */
const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  } catch (error) {
    logger.error('Error generating JWT:', error.message);
    throw new Error('Failed to generate token');
  }
};

/**
 * Verifies a JSON Web Token (JWT).
 * @param {string} token - The JWT to verify.
 * @returns {object} The decoded payload if the token is valid.
 * @throws {Error} If the token is invalid or expired.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Error verifying JWT:', error.message);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};