const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const db = require('../models');

const createUser = catchAsync(async (req, res) => {
  if (await db.User.isEmailTaken(req.body.email)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  const user = await db.User.create(req.body);
  res.status(httpStatus.CREATED).send(user.toJSON());
});

const getUsers = catchAsync(async (req, res) => {
  // Implement pagination, filtering, sorting here
  const users = await db.User.findAll();
  res.send(users.map(user => user.toJSON()));
});

const getUser = catchAsync(async (req, res) => {
  const user = await db.User.findByPk(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user.toJSON());
});

const updateUser = catchAsync(async (req, res) => {
  const user = await db.User.findByPk(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (req.body.email && (await db.User.isEmailTaken(req.body.email, req.params.userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, req.body);
  await user.save();
  res.send(user.toJSON());
});

const deleteUser = catchAsync(async (req, res) => {
  const user = await db.User.findByPk(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.destroy();
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};