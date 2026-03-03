const httpStatus = require('http-status');
const jwt = require('jsonwebtoken');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

const generateToken = (userId, secret, expiresIn) => {
  const payload = {
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
  };
  return jwt.sign(payload, secret, { expiresIn });
};

const generateAuthTokens = async (user) => {
  const accessTokenExpires = process.env.JWT_ACCESS_EXPIRATION_MINUTES * 60; // in seconds
  const accessToken = generateToken(user.id, process.env.JWT_SECRET, accessTokenExpires);

  // In a real system, refresh tokens are stored in the DB and are longer-lived
  // For this example, we'll just generate a dummy one.
  const refreshToken = generateToken(user.id, process.env.JWT_SECRET, '7d');

  return {
    access: {
      token: accessToken,
      expires: new Date(Date.now() + accessTokenExpires * 1000).toISOString(),
    },
    refresh: {
      token: refreshToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
  };
};

module.exports = {
  loginUserWithEmailAndPassword,
  generateAuthTokens,
};