const jwt = require('jsonwebtoken');
const config = require('../config');

/**
 * Generates a JWT token for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {string} - The generated JWT token.
 */
const generateToken = (userId) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000)
  };
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expirationDays
  });
  return token;
};

/**
 * Verifies a JWT token.
 * @param {string} token - The JWT token to verify.
 * @returns {object} - The decoded payload if verification is successful.
 * @throws {Error} If the token is invalid or expired.
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

module.exports = {
  generateToken,
  verifyToken
};
```

```