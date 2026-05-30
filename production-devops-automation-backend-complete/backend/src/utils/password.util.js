```javascript
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const hashPassword = async (password) => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    logger.error('Error hashing password:', error);
    throw new AppError('Failed to hash password', 500);
  }
};

const comparePassword = async (candidatePassword, hashedPassword) => {
  try {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  } catch (error) {
    logger.error('Error comparing password:', error);
    throw new AppError('Failed to compare password', 500);
  }
};

module.exports = {
  hashPassword,
  comparePassword,
};
```