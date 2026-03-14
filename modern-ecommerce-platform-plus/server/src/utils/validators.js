```javascript
// server/src/utils/validators.js
const Joi = require('joi');

const authValidation = {
  register: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
  }),
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const productValidation = {
  createProduct: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    price: Joi.number().positive().required(),
    category: Joi.string().required(),
    brand: Joi.string().optional(),
    stock: Joi.number().integer().min(0).required(),
    imageUrl: Joi.string().uri().optional(), // Or handle file uploads
  }),
  updateProduct: Joi.object({
    name: Joi.string().optional(),
    description: Joi.string().optional(),
    price: Joi.number().positive().optional(),
    category: Joi.string().optional(),
    brand: Joi.string().optional(),
    stock: Joi.number().integer().min(0).optional(),
    imageUrl: Joi.string().uri().optional(),
  }),
};

// Generic validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    const errorMessage = error.details.map((detail) => detail.message).join(', ');
    return res.status(400).json({ message: errorMessage });
  }
  next();
};

module.exports = {
  authValidation,
  productValidation,
  validate,
};

```