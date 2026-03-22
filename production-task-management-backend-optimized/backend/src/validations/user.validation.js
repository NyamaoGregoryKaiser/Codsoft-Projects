```javascript
const Joi = require('joi');

const createUser = Joi.object().keys({
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(128)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  role: Joi.string().valid('USER', 'ADMIN').default('USER'),
});

const getUser = Joi.object().keys({
  userId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

const updateUser = Joi.object().keys({
  firstName: Joi.string().min(2).max(50),
  lastName: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  role: Joi.string().valid('USER', 'ADMIN'),
});

const deleteUser = Joi.object().keys({
  userId: Joi.string().guid({ version: ['uuidv4'] }).required(),
});

module.exports = {
  createUser,
  getUser,
  updateUser,
  deleteUser,
};
```