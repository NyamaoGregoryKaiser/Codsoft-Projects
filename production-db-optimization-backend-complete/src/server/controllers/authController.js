const asyncHandler = require('express-async-handler'); // Simple wrapper for async errors
const authService = require('../services/authService');
const { APIError } = require('../utils/apiError');

const register = asyncHandler(async (req, res, next) => {
  const { username, email, password, role } = req.body;
  const user = await authService.registerUser(username, email, password, role);
  res.status(201).json(user);
});

const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await authService.loginUser(email, password);
  res.status(200).json(user);
});

const getMe = asyncHandler(async (req, res, next) => {
  // req.user is set by the protect middleware
  res.status(200).json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  });
});

module.exports = {
  register,
  login,
  getMe,
};