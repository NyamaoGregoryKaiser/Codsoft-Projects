```javascript
const authService = require('../services/authService');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  const { username, email, password } = req.body;
  try {
    const { user, token } = await authService.registerUser(username, email, password);
    res.status(201).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const { user, token } = await authService.loginUser(email, password);
    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  // req.user is set by authMiddleware.protect
  res.status(200).json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
  });
};

module.exports = {
  register,
  login,
  getProfile,
};
```