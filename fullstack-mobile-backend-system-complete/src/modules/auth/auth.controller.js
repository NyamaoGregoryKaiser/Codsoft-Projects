```javascript
const httpStatus = require('http-status');
const catchAsync = require('../../utils/catchAsync');
const authService = require('./auth.service');
const userService = require('../users/user.service');
const { generateAuthTokens } = require('../../config/jwt');

/**
 * Register a new user.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

/**
 * Log in an existing user.
 * @param {Object} req - Express request object
 *   @property {string} req.body.email
 *   @property {string} req.body.password
 * @param {Object} res - Express response object
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = generateAuthTokens(user);
  res.status(httpStatus.OK).send({ user, tokens });
});

/**
 * Refresh access and refresh tokens.
 * @param {Object} req - Express request object
 *   @property {string} req.body.refreshToken
 * @param {Object} res - Express response object
 */
const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const newTokens = await authService.refreshAuthTokens(refreshToken);
  res.status(httpStatus.OK).send(newTokens);
});

module.exports = {
  register,
  login,
  refreshTokens,
};
```