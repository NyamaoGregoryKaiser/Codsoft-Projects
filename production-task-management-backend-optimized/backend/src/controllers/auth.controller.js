```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService } = require('../services');
const { generateToken } = require('../utils/jwt');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const token = generateToken(user.id, user.role);
  res.status(httpStatus.CREATED).send({ user, token });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const token = generateToken(user.id, user.role);
  res.send({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }, token });
});

module.exports = {
  register,
  login,
};
```