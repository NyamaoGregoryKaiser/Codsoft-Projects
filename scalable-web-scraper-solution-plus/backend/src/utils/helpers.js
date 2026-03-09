```javascript
/**
 * Utility function to generate a JWT token.
 * @param {string} id - The user ID.
 * @returns {string} The generated JWT token.
 */
const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

module.exports = {
  generateToken,
};
```