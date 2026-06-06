```javascript
const Joi = require('joi');

// Custom Joi validation for UUID
const uuid = (value, helpers) => {
  if (!value.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-4[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/)) {
    return helpers.message('"{{#label}}" must be a valid UUID');
  }
  return value;
};

const createUser = Joi.object().keys({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: Joi.string().required().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  role: Joi.string().valid('USER', 'ADMIN').default('USER'),
});

const getUsers = Joi.object().keys({
  name: Joi.string(),
  email: Joi.string().email(),
  role: Joi.string().valid('USER', 'ADMIN'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1),
  sortBy: Joi.string(), // e.g., 'createdAt:desc,name:asc'
});

const getUser = Joi.object().keys({
  userId: Joi.custom(uuid).required(),
});

const updateUser = Joi.object().keys({
  name: Joi.string(),
  email: Joi.string().email(),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).*$/)
    .message('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.'),
  role: Joi.string().valid('USER', 'ADMIN'), // Admin can change role
})
  .min(1); // At least one field is required for update

const deleteUser = Joi.object().keys({
  userId: Joi.custom(uuid).required(),
});

module.exports = {
  uuid,
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
```