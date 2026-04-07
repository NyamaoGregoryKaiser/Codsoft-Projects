```javascript
const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');
const logger = require('../utils/logger');

exports.register = catchAsync(async (req, res, next) => {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  const { user, token } = await authService.loginUser({ email, password });
  res.status(200).json({
    status: 'success',
    token,
    data: {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});

exports.getMe = catchAsync(async (req, res, next) => {
  // req.user is populated by the protect middleware
  res.status(200).json({
    status: 'success',
    data: {
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});
```