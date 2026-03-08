```javascript
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { ApiError } = require('../utils/errorHandler');
const { userRepository } = require('../data-access/repositories');
const logger = require('../utils/logger');

const registerUser = async (userData) => {
  if (await userRepository.findByEmail(userData.email)) {
    throw new ApiError('Email already taken', httpStatus.BAD_REQUEST);
  }

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const newUser = {
    id: uuidv4(),
    ...userData,
    password: hashedPassword,
  };

  const user = await userRepository.create(newUser);
  logger.info(`User registered: ${user.email}`);
  return user;
};

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new ApiError('Incorrect email or password', httpStatus.UNAUTHORIZED);
  }
  logger.info(`User logged in: ${user.email}`);
  return user;
};

const generateAuthTokens = (user) => {
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, config.jwt.secret, {
    expiresIn: `${config.jwt.accessExpirationMinutes}m`,
  });

  // For simplicity, a refresh token isn't stored in DB here, but in a real app, it would be.
  // We'll use the session for managing "remember me" functionality.
  return {
    accessToken,
    expiresIn: config.jwt.accessExpirationMinutes * 60, // seconds
  };
};

module.exports = {
  registerUser,
  loginUserWithEmailAndPassword,
  generateAuthTokens,
};
```