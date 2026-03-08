```javascript
const httpStatus = require('http-status');
const { authService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  const tokens = authService.generateAuthTokens(user);
  res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const tokens = authService.generateAuthTokens(user);

  // Set refresh token in http-only cookie (for production) or session (for simplicity)
  // For this example, we'll use express-session which relies on cookies
  req.session.userId = user.id; // Store user ID in session
  req.session.accessToken = tokens.accessToken; // Store token for easy access

  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({ message: 'Could not log out' });
    }
    res.status(httpStatus.NO_CONTENT).send();
  });
});

const getCurrentUser = catchAsync(async (req, res) => {
  // If authenticated via JWT, req.user is set by auth middleware
  res.send(req.user);
});

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
```