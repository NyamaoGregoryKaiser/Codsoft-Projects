```javascript
// server/src/controllers/authController.js
const httpStatus = require('http-status-codes');
const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger');

const register = catchAsync(async (req, res) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(httpStatus.CREATED).json({ user, token });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.loginUser(email, password);
  res.status(httpStatus.OK).json({ user, token });
});

const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getUserProfile(req.user.id);
  res.status(httpStatus.OK).json(user);
});

const updateProfile = catchAsync(async (req, res) => {
  const updatedUser = await authService.updateProfile(req.user.id, req.body);
  res.status(httpStatus.OK).json(updatedUser);
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
};

```