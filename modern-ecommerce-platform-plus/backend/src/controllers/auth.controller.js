const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const register = async (req, res, next) => {
  try {
    const { userId, tokens } = await authService.registerUser(req.body);
    res.status(201).json({
      status: 'success',
      data: {
        userId,
        tokens,
      },
    });
  } catch (error) {
    logger.error('Registration failed:', error.message);
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, tokens } = await authService.loginUserWithEmailAndPassword(email, password);
    res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        tokens,
      },
    });
  } catch (error) {
    logger.error('Login failed:', error.message);
    res.status(401).json({ status: 'fail', message: error.message });
  }
};

const refreshTokens = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAuthTokens(refreshToken);
    res.status(200).json({ status: 'success', data: { tokens } });
  } catch (error) {
    logger.error('Refresh token failed:', error.message);
    res.status(401).json({ status: 'fail', message: error.message });
  }
};

module.exports = {
  register,
  login,
  refreshTokens,
};