```javascript
const Joi = require('joi');

// Custom Joi extension for UUID validation
const JoiExtended = Joi.extend((joi) => ({
  type: 'uuid',
  base: joi.string(),
  messages: {
    'uuid.invalid': '{{#label}} must be a valid UUID',
  },
  validate(value, helpers) {
    if (!value.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
      return { value, errors: helpers.error('uuid.invalid') };
    }
    return { value };
  },
}));


const registerSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(3).required(),
  content: Joi.string().min(10).required(),
  excerpt: Joi.string().allow('').max(500),
  slug: Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(), // kebab-case
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  categoryId: JoiExtended.uuid().optional().allow(null),
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(3).optional(),
  content: Joi.string().min(10).optional(),
  excerpt: Joi.string().allow('').max(500).optional(),
  slug: Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  status: Joi.string().valid('draft', 'published', 'archived').optional(),
  categoryId: JoiExtended.uuid().optional().allow(null),
  removeFeaturedImage: Joi.boolean().optional(), // For indicating removal of featured image
});

const updateUserSchema = Joi.object({
  username: Joi.string().trim().min(3).max(30).optional(),
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  role: Joi.string().valid('user', 'author', 'editor', 'admin').optional(), // Role updates should be handled with care
});

const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).required(),
  description: Joi.string().allow('').optional(),
  slug: Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
});

const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).optional(),
  description: Joi.string().allow('').optional(),
  slug: Joi.string().trim().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
});


module.exports = {
  registerSchema,
  loginSchema,
  createPostSchema,
  updatePostSchema,
  updateUserSchema,
  createCategorySchema,
  updateCategorySchema,
};
```