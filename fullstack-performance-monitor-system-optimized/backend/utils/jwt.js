```javascript
const jwt = require('jsonwebtoken');
const logger = require('./logger');

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

/**
 * Generates a JSON Web Token.
 * @param {object} payload - The data to embed in the token.
 * @returns {string} The signed JWT.
 */
const generateToken = (payload) => {
  try {
    return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
  } catch (error) {
    logger.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token.');
  }
};

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT to verify.
 * @returns {object} The decoded payload if verification is successful.
 * @throws {Error} If the token is invalid or expired.
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, SECRET);
  } catch (error) {
    logger.error('Error verifying token:', error);
    if (error.name === 'TokenExpiredError') {
      throw new Error('Authentication token has expired.');
    }
    throw new Error('Invalid authentication token.');
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
```