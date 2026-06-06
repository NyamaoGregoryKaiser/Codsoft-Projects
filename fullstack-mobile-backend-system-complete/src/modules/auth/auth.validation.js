```javascript
const Joi = require('joi');

const register = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
});

const login = Joi.object().keys({
  email: Joi.string().required().email(),
  password: Joi.string().required(),
});

const refreshTokens = Joi.object().keys({
  refreshToken: Joi.string().required(),
});

module.exports = {
  register,
  login,
  refreshTokens,
};
```