```javascript
const jwt = require('jsonwebtoken');
const config = require('../config/env');
const logger = require('./logger');

const generateToken = (payload) => {
  try {
    return jwt.sign(payload, config.JWT_SECRET, { expiresIn: config.JWT_EXPIRES_IN });
  } catch (error) {
    logger.error('Error generating JWT:', error);
    throw new Error('Failed to generate token');
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    logger.error('Error verifying JWT:', error);
    throw new Error('Invalid or expired token');
  }
};

module.exports = { generateToken, verifyToken };
```