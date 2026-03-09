```javascript
const asyncHandler = require('../middleware/errorMiddleware').asyncHandler;
const userService = require('../services/userService');
const { authorizeRoles } = require('../middleware/authMiddleware');

/**
 * @desc Get all users
 * @route GET /api/users
 * @access Private/Admin
 */
const getUsers = [authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const users = await userService.getAllUsers();
  res.status(200).json(users);
})];

/**
 * @desc Get user by ID
 * @route GET /api/users/:id
 * @access Private/Admin
 */
const getUserById = [authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json(user);
})];

/**
 * @desc Update user profile
 * @route PUT /api/users/:id
 * @access Private/Admin (or user themselves)
 * Note: For simplicity, this example allows admin to update any user,
 *       or a user to update their own profile (if `:id` matches `req.user.id`).
 *       The `authorizeRoles('admin')` here means only admin can use this endpoint on other users.
 *       A separate endpoint for 'me' for non-admin users might be better for fine-grained control.
 */
const updateUser = [authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const updatedUser = await userService.updateUserProfile(req.params.id, req.body);
  res.status(200).json(updatedUser);
})];

/**
 * @desc Delete user
 * @route DELETE /api/users/:id
 * @access Private/Admin
 */
const deleteUser = [authorizeRoles('admin'), asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(200).json({ message: 'User removed' });
})];

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
```