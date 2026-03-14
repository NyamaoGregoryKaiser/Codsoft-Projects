```javascript
const asyncHandler = require('../middleware/async'); // Custom async handler
const ErrorResponse = require('../utils/errorResponse');
const { sendTokenResponse } = require('../utils/jwt');
const authService = require('../services/authService');
const logger = require('../config/winston');

// @desc      Register user
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return next(new ErrorResponse('Please provide a username, email, and password', 400));
  }

  const user = await authService.registerUser(username, email, password);
  sendTokenResponse(user, 201, res);
});

// @desc      Login user
// @route     POST /api/v1/auth/login
// @access    Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await authService.loginUser(email, password);
  sendTokenResponse(user, 200, res);
});

// @desc      Get current logged in user
// @route     GET /api/v1/auth/me
// @access    Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await authService.getMe(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc      Log user out / clear cookie
// @route     GET /api/v1/auth/logout
// @access    Private
exports.logout = asyncHandler(async (req, res, next) => {
  // If using HTTP-only cookies:
  // res.cookie('token', 'none', {
  //   expires: new Date(Date.now() + 10 * 1000),
  //   httpOnly: true
  // });

  logger.info(`User ${req.user.id} logged out.`);
  res.status(200).json({
    success: true,
    data: {} // No data needed, just confirm logout
  });
});
```