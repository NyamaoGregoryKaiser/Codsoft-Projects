```javascript
const jwt = require('jsonwebtoken');
const httpStatus = require('http-status');
const config = require('../config');
const { ApiError } = require('../utils/errorHandler');
const { userRepository } = require('../data-access/repositories');
const { projectRepository } = require('../data-access/repositories');

const auth = () => async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // Bearer Token
    if (!token) {
      throw new ApiError('Authentication token missing', httpStatus.UNAUTHORIZED);
    }

    const payload = jwt.verify(token, config.jwt.secret);
    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new ApiError('User not found', httpStatus.UNAUTHORIZED);
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError('Invalid or expired token', httpStatus.UNAUTHORIZED));
    }
    next(new ApiError(error.message, error.statusCode || httpStatus.UNAUTHORIZED));
  }
};

const apiKeyAuth = () => async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new ApiError('API Key missing', httpStatus.UNAUTHORIZED);
    }

    const project = await projectRepository.findByApiKey(apiKey);
    if (!project) {
      throw new ApiError('Invalid API Key', httpStatus.UNAUTHORIZED);
    }

    req.project = project; // Attach the project associated with the API key
    next();
  } catch (error) {
    next(new ApiError(error.message, error.statusCode || httpStatus.UNAUTHORIZED));
  }
};

module.exports = {
  auth,
  apiKeyAuth,
};
```