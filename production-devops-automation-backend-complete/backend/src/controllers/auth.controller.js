```javascript
const authService = require('../services/auth.service');
const { registerSchema, loginSchema } = require('../validators/auth.validator');
const catchAsync = require('../utils/catchAsync');
const logger = require('../config/logger.config');

const register = catchAsync(async (req, res, next) => {
  const { error } = registerSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { username, email, password, role } = req.body;
  const { user, token } = await authService.registerUser(username, email, password, role);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

const login = catchAsync(async (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return next(error);
  }

  const { email, password } = req.body;
  const { user, token } = await authService.loginUser(email, password);

  res.status(200).json({
    message: 'Logged in successfully',
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    token,
  });
});

const getMe = catchAsync(async (req, res, next) => {
  // User object is attached by authMiddleware
  res.status(200).json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = {
  register,
  login,
  getMe,
};
```