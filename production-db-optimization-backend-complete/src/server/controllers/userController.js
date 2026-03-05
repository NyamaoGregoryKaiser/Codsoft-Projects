const asyncHandler = require('express-async-handler');
const userService = require('../services/userService');
const { APIError } = require('../utils/apiError');

const getUsers = asyncHandler(async (req, res, next) => {
  const users = await userService.getAllUsers();
  res.status(200).json(users);
});

const getUserById = asyncHandler(async (req, res, next) => {
  const user = await userService.findUserById(req.params.id);
  if (!user) {
    throw new APIError('User not found', 404);
  }
  res.status(200).json(user);
});

const updateUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // Prevent users from changing their own role unless admin
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    throw new APIError('Not authorized to update this user', 403);
  }
  const updatedUser = await userService.updateUser(id, req.body);
  res.status(200).json(updatedUser);
});

const deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // Only admin or the user themselves can delete
  if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
    throw new APIError('Not authorized to delete this user', 403);
  }
  const result = await userService.deleteUser(id);
  res.status(200).json(result);
});

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};