```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const ApiError = require('../utils/ApiError');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.email) filter.email = { contains: req.query.email, mode: 'insensitive' };
  if (req.query.search) {
    filter.OR = [
      { firstName: { contains: req.query.search, mode: 'insensitive' } },
      { lastName: { contains: req.query.search, mode: 'insensitive' } },
      { email: { contains: req.query.search, mode: 'insensitive' } },
    ];
    delete req.query.search; // Ensure it's not passed as a direct filter
  }

  const options = {
    limit: req.query.limit,
    page: req.query.page,
    sortBy: req.query.sortBy,
    sortOrder: req.query.sortOrder,
  };
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

// Get profile of authenticated user
const getMyProfile = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.user.id);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User profile not found');
  }
  res.send(user);
});

// Update profile of authenticated user
const updateMyProfile = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.user.id, req.body);
  res.send(user);
});


module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getMyProfile,
  updateMyProfile,
};
```