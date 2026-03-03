const httpStatus = require('http-status');
const authService = require('./auth.service');
const userService = require('../users/user.service');
const ApiError = require('../../utils/ApiError');
const logger = require('../../utils/logger');

const register = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);
    const tokens = await authService.generateAuthTokens(user);
    res.status(httpStatus.CREATED).send({ user: user.toPublicJSON(), tokens });
  } catch (error) {
    logger.error('Registration error:', error);
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const tokens = await authService.generateAuthTokens(user);
    res.send({ user: user.toPublicJSON(), tokens });
  } catch (error) {
    logger.error('Login error:', error);
    next(error);
  }
};

const refreshTokens = async (req, res, next) => {
  // Placeholder: In a real system, you'd handle refresh tokens securely
  // This would typically involve validating the refresh token against a database,
  // rotating it, and issuing new access and refresh tokens.
  next(new ApiError(httpStatus.NOT_IMPLEMENTED, 'Refresh tokens not fully implemented'));
};

module.exports = {
  register,
  login,
  refreshTokens,
};