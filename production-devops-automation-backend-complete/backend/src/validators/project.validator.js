```javascript
const Joi = require('joi');

const createProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).allow(null, ''),
});

const updateProjectSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(1000).allow(null, '').optional(),
  status: Joi.string().valid('active', 'completed', 'on-hold', 'cancelled').optional(),
}).min(1); // At least one field is required for update

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
```