```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService } = require('../services');
const { generateAuthTokens } = require('../utils/jwt');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const tokens = generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  // In a real app, you might invalidate refresh tokens here (e.g., blacklist in Redis)
  // For simplicity, we'll just send a success message.
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  // This would typically take a refresh token and return new access/refresh tokens.
  // For simplicity in this example, we'll assume the client manages refresh token rotation.
  // In a real application, you'd verify the refresh token and issue new ones.
  res.status(httpStatus.NOT_IMPLEMENTED).send({ message: 'Refresh token endpoint not fully implemented for this demo.' });
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
};
```