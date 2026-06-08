const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const db = require('../models');
const { generateAuthTokens } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  if (await db.User.isEmailTaken(req.body.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await db.User.create(req.body);
  const tokens = await generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: user.toJSON(), tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await db.User.scope('withPassword').findOne({ where: { email } });

  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const tokens = await generateAuthTokens(user);
  res.send({ user: user.toJSON(), tokens });
});

// Refresh token, logout etc. would be added here
const logout = catchAsync(async (req, res) => {
  // In a real app, you would invalidate refresh tokens, possibly store them in DB
  // For JWT, typically client just deletes them.
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
};