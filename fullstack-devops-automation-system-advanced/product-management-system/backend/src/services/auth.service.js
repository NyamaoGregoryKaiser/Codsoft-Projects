const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { UserService } = require('./index');
const { generateToken } = require('../utils/jwt');

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await UserService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};

/**
 * Generate auth token
 * @param {UUID} userId
 * @returns {Promise<string>}
 */
const generateAuthToken = async (userId) => {
  const token = generateToken(userId);
  return token;
};

module.exports = {
  loginUserWithEmailAndPassword,
  generateAuthToken
};
```

```