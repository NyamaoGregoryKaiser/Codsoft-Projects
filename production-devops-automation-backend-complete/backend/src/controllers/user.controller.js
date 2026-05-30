```javascript
// A simple controller for user management (e.g., admin features)
const { User } = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../config/logger.config');

const getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.findAll({
    attributes: ['id', 'username', 'email', 'role', 'createdAt'],
  });
  res.status(200).json(users);
});

// Example for potential future admin actions
const getUserById = catchAsync(async (req, res, next) => {
  const user = await User.findByPk(req.params.id, {
    attributes: ['id', 'username', 'email', 'role', 'createdAt'],
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  res.status(200).json(user);
});

module.exports = {
  getAllUsers,
  getUserById,
};
```