const jwt = require('jsonwebtoken');
const config = require('../config');
const { promisify } = require('util');

const signToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = async (token, secret) => {
  return promisify(jwt.verify)(token, secret);
};

const generateAuthTokens = async (userId, role) => {
  const accessTokenExpires = Math.floor(Date.now() / 1000) + (config.JWT_ACCESS_EXPIRATION_MINUTES * 60);
  const refreshTokenExpires = Math.floor(Date.now() / 1000) + (config.JWT_REFRESH_EXPIRATION_DAYS * 24 * 60 * 60);

  const accessToken = signToken({ sub: userId, role, type: 'access' }, config.JWT_SECRET, accessTokenExpires);
  const refreshToken = signToken({ sub: userId, type: 'refresh' }, config.JWT_SECRET, refreshTokenExpires);

  return {
    access: {
      token: accessToken,
      expires: new Date(accessTokenExpires * 1000),
    },
    refresh: {
      token: refreshToken,
      expires: new Date(refreshTokenExpires * 1000),
    },
  };
};

module.exports = {
  signToken,
  verifyToken,
  generateAuthTokens,
};