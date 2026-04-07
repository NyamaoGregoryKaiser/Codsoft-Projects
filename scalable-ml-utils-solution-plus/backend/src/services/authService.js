```javascript
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db');
const config = require('../config/config');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

const signToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

const registerUser = async ({ username, email, password, role = 'user' }) => {
  try {
    const newUser = await db.User.create({
      username,
      email,
      password,
      role: role === 'admin' && config.env === 'development' ? 'admin' : 'user', // Only allow admin registration in dev
    });

    const token = signToken(newUser.id);
    logger.info(`User registered: ${newUser.username} (${newUser.id})`);
    return { user: newUser, token };
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('User with that username or email already exists.', 400);
    }
    logger.error('Error registering user:', error);
    throw new AppError('Could not register user due to a server error.', 500);
  }
};

const loginUser = async ({ email, password }) => {
  const user = await db.User.findOne({ where: { email } });

  if (!user || !(await user.isValidPassword(password))) {
    logger.warn(`Failed login attempt for email: ${email}`);
    throw new AppError('Incorrect email or password', 401);
  }

  const token = signToken(user.id);
  logger.info(`User logged in: ${user.username} (${user.id})`);
  return { user, token };
};

module.exports = { registerUser, loginUser, signToken };
```