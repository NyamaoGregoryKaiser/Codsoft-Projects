const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.register = catchAsync(async (req, res, next) => {
  const { username, email, password, role } = req.body;
  const { user, token } = await authService.registerUser(username, email, password, role);

  res.status(201).json({
    status: 'success',
    token,
    data: { user },
  });
  logger.info(`User registered: ${user.username}`);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  const { user, token } = await authService.loginUser(email, password);

  res.status(200).json({
    status: 'success',
    token,
    data: { user },
  });
  logger.info(`User logged in: ${user.username}`);
});