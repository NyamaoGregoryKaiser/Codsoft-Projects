```javascript
const Joi = require('joi');
const { User } = require('../models');

const createUser = {
  body: Joi.object().keys({
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).max(100).required(),
    role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer'),
  }).custom(async (value, helpers) => {
    const existingUser = await User.findOne({ where: { email: value.email } });
    if (existingUser) {
      return helpers.error('any.custom', { message: 'Email already taken' });
    }
    const existingUsername = await User.findOne({ where: { username: value.username } });
    if (existingUsername) {
      return helpers.error('any.custom', { message: 'Username already taken' });
    }
    return value;
  }),
};

const getUsers = {
  query: Joi.object().keys({
    username: Joi.string(),
    role: Joi.string().valid('admin', 'editor', 'viewer'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    username: Joi.string().min(3).max(50),
    email: Joi.string().email(),
    password: Joi.string().min(8).max(100),
    role: Joi.string().valid('admin', 'editor', 'viewer'),
  }).min(1).custom(async (value, helpers) => {
    if (value.email) {
      const existingUser = await User.findOne({ where: { email: value.email } });
      if (existingUser && existingUser.id !== helpers.state.ancestors[0].params.userId) {
        return helpers.error('any.custom', { message: 'Email already taken' });
      }
    }
    if (value.username) {
      const existingUsername = await User.findOne({ where: { username: value.username } });
      if (existingUsername && existingUsername.id !== helpers.state.ancestors[0].params.userId) {
        return helpers.error('any.custom', { message: 'Username already taken' });
      }
    }
    return value;
  }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
```