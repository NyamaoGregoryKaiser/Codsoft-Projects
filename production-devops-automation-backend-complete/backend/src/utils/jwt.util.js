```javascript
const jwt = require('jsonwebtoken');
const config = require('../config');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const generateToken = (payload) => {
  try {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  } catch (error) {
    logger.error('Error generating JWT token:', error);
    throw new AppError('Failed to generate token', 500);
  }
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    logger.error('Error verifying JWT token:', error);
    throw new AppError('Invalid or expired token', 401);
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
```