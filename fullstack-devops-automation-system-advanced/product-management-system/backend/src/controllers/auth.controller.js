const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService } = require('../services');

const register = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  const token = await authService.generateAuthToken(user.id);
  res.status(httpStatus.CREATED).send({ message: 'User registered successfully', userId: user.id, token });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);
  const token = await authService.generateAuthToken(user.id);
  res.send({ token, userId: user.id });
});

module.exports = {
  register,
  login
};
```

```