```javascript
const httpStatus = require('http-status-codes');
const catchAsync = require('../utils/catchAsync');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body); // Use userService for creation
  const tokens = await authService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user: user.toJSON(), tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = await authService.generateAuthTokens(user);
  res.send({ user: user.toJSON(), tokens });
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuthTokens(req.body.refreshToken);
  res.send({ ...tokens });
});

const logout = catchAsync(async (req, res) => {
  // For JWT, logout is typically client-side by discarding tokens.
  // If we had a database to store refresh tokens, we'd invalidate them here.
  // For this simplified setup, we just acknowledge.
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  refreshTokens,
  logout,
};
```