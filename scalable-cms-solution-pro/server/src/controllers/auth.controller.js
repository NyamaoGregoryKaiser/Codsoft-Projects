```javascript
const httpStatus = require('http-status');
const authService = require('../services/auth.service');
const userService = require('../services/user.service');
const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

exports.register = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await userService.createUser({ username, email, password, role: 'author' }); // Default role for registration
    const token = await authService.generateAuthToken(user);
    logger.info(`New user registered: ${user.email}`);
    res.status(httpStatus.CREATED).json({ message: 'User registered successfully', token, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await authService.loginUserWithEmailAndPassword(email, password);
    const token = await authService.generateAuthToken(user);
    logger.info(`User logged in: ${user.email}`);
    res.status(httpStatus.OK).json({ message: 'Logged in successfully', token, user: user.toJSON() });
  } catch (error) {
    next(error);
  }
};
```