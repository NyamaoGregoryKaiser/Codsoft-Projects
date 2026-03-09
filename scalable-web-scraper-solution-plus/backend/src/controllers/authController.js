```javascript
const asyncHandler = require('../middleware/errorMiddleware').asyncHandler;
const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * @desc Register new user
 * @route POST /api/auth/register
 * @access Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  const user = await authService.registerUser(username, email, password);

  res.status(201).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    token: user.token,
  });
});

/**
 * @desc Authenticate user & get token
 * @route POST /api/auth/login
 * @access Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please enter all fields');
  }

  const user = await authService.loginUser(email, password);

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    token: user.token,
  });
});

/**
 * @desc Get user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the protect middleware
  const user = await authService.getUserById(req.user.id);
  res.status(200).json(user);
});

module.exports = {
  registerUser,
  loginUser,
  getMe,
};
```