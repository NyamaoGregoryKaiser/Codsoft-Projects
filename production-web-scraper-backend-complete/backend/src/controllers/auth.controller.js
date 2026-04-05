const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const tokens = await authService.createAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: user.toJSON(), tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await authService.createAuthTokens(user);
  res.send({ user: user.toJSON(), tokens });
});

module.exports = {
  register,
  login,
};