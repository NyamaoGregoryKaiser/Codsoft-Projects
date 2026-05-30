```javascript
const { User } = require('../models');
const jwtUtil = require('../utils/jwt.util');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const registerUser = async (username, email, password, role = 'user') => {
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new AppError('User with that email already exists.', 400);
    }
    const user = await User.create({ username, email, password, role });
    logger.info(`User registered: ${user.email}`);
    const token = jwtUtil.generateToken({ id: user.id, role: user.role });
    return { user, token };
  } catch (error) {
    logger.error(`Error during user registration for email ${email}: ${error.message}`);
    throw error;
  }
};

const loginUser = async (email, password) => {
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid credentials', 401);
    }
    logger.info(`User logged in: ${user.email}`);
    const token = jwtUtil.generateToken({ id: user.id, role: user.role });
    return { user, token };
  } catch (error) {
    logger.error(`Error during user login for email ${email}: ${error.message}`);
    throw error;
  }
};

module.exports = {
  registerUser,
  loginUser,
};
```