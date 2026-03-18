```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService } = require('../services');
const ApiResponse = require('../utils/ApiResponse');

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, 'User registered successfully', { user, tokens }));
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await tokenService.generateAuthTokens(user);
  res.send(new ApiResponse(httpStatus.OK, 'Login successful', { user, tokens }));
});

const logout = catchAsync(async (req, res) => {
  // In a real app, you'd invalidate the refresh token in the DB/Redis.
  // For this example, we just blacklist the token if it's explicitly passed,
  // or simply return success as JWTs are stateless after client-side removal.
  const refreshToken = req.body.refreshToken;
  if (refreshToken) {
    tokenService.blacklistToken(refreshToken);
  }
  res.status(httpStatus.NO_CONTENT).send(); // Or 200 with a success message
});

const refreshTokens = catchAsync(async (req, res) => {
  const { user, tokens } = await authService.refreshAuth(req.body.refreshToken);
  res.send(new ApiResponse(httpStatus.OK, 'Tokens refreshed successfully', { user, tokens }));
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
};
```