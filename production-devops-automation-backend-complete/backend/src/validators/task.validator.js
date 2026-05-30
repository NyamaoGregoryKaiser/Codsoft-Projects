```javascript
const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(1000).allow(null, ''),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'blocked').default('pending').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  assigneeId: Joi.string().uuid().allow(null).optional(),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(1000).allow(null, '').optional(),
  status: Joi.string().valid('pending', 'in-progress', 'completed', 'blocked').optional(),
  priority: Joi.string().valid('low', 'medium', 'high').optional(),
  dueDate: Joi.date().iso().allow(null).optional(),
  assigneeId: Joi.string().uuid().allow(null).optional(),
}).min(1); // At least one field is required for update

module.exports = {
  createTaskSchema,
  updateTaskSchema,
};
```