```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const userService = require('./user.service');
const { comparePassword } = require('../utils/bcrypt');

const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await comparePassword(password, user.password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

module.exports = {
  loginUserWithEmailAndPassword,
};
```