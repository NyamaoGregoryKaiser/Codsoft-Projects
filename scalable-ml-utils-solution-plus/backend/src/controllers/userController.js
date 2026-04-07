```javascript
const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await userService.getAllUsers();
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
    },
  });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// For a user to update their own profile
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1. Filter out unwanted fields that are not allowed to be updated
  const filteredBody = { ...req.body };
  delete filteredBody.password;
  delete filteredBody.role; // Users cannot change their own role

  // 2. Update user data
  const updatedUser = await userService.updateUser(req.user.id, filteredBody);

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// For a user to delete their own account
exports.deleteMe = catchAsync(async (req, res, next) => {
  await userService.deleteUser(req.user.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
```