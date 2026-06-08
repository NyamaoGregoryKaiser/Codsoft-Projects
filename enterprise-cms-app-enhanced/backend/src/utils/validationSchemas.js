const Joi = require('joi');
const { password } = require('./customValidation'); // Create customValidation.js for complex password rules if needed

const register = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string().required().min(8) // .custom(password) for more complex rules
});

const login = Joi.object({
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string().required()
});

const createUser = Joi.object({
  name: Joi.string().required().trim(),
  email: Joi.string().required().email().trim().lowercase(),
  password: Joi.string().required().min(8),
  role: Joi.string().valid('user', 'editor', 'admin').default('user')
});

const updateUser = Joi.object({
  name: Joi.string().trim(),
  email: Joi.string().email().trim().lowercase(),
  password: Joi.string().min(8),
  role: Joi.string().valid('user', 'editor', 'admin')
}).min(1);

const createPost = Joi.object({
  title: Joi.string().required().trim(),
  content: Joi.string().required(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  categoryId: Joi.string().uuid().required(),
  featuredImageId: Joi.string().uuid().allow(null, '')
});

const updatePost = Joi.object({
  title: Joi.string().trim(),
  content: Joi.string(),
  status: Joi.string().valid('draft', 'published', 'archived'),
  categoryId: Joi.string().uuid(),
  featuredImageId: Joi.string().uuid().allow(null, '')
}).min(1);

const createCategory = Joi.object({
  name: Joi.string().required().trim(),
  description: Joi.string().allow('', null)
});

const updateCategory = Joi.object({
  name: Joi.string().trim(),
  description: Joi.string().allow('', null)
}).min(1);

module.exports = {
  register,
  login,
  createUser,
  updateUser,
  createPost,
  updatePost,
  createCategory,
  updateCategory,
};