const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: { users },
  });
  logger.debug('Fetched all users.');
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
  logger.debug(`Fetched user: ${req.params.id}`);
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { user },
  });
  logger.info(`Updated user: ${req.params.id}`);
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
  logger.warn(`Deleted user: ${req.params.id}`);
});