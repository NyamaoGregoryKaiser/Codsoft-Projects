```javascript
const asyncHandler = require('../middleware/async');
const userService = require('../services/userService');
const logger = require('../config/winston');
const ErrorResponse = require('../utils/errorResponse');

// @desc      Get all users
// @route     GET /api/v1/users
// @access    Private (can be admin only, or general for chat members)
exports.getUsers = asyncHandler(async (req, res, next) => {
  const users = await userService.getAllUsers();
  res.status(200).json({ success: true, count: users.length, data: users });
});

// @desc      Get single user
// @route     GET /api/v1/users/:id
// @access    Private
exports.getUser = asyncHandler(async (req, res, next) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
});

// @desc      Update user
// @route     PUT /api/v1/users/:id
// @access    Private (Owner or Admin)
exports.updateUser = asyncHandler(async (req, res, next) => {
  // Only allow updating own profile or if admin
  if (req.user.id.toString() !== req.params.id) { // && req.user.role !== 'admin'
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update user ${req.params.id}`, 403));
  }

  const { username, email } = req.body; // Prevent password update via this route
  const updatedUser = await userService.updateUser(req.params.id, { username, email });
  res.status(200).json({ success: true, data: updatedUser });
});

// @desc      Delete user
// @route     DELETE /api/v1/users/:id
// @access    Private (Admin only)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  // Example: Only admin can delete users
  // if (req.user.role !== 'admin') {
  //   return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete users`, 403));
  // }

  await userService.deleteUser(req.params.id);
  res.status(200).json({ success: true, data: {} });
});
```