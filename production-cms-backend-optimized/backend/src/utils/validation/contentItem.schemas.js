```javascript
const Joi = require('joi');

// Base schema for content item creation
// Note: 'data' field will be dynamically validated by the service based on ContentType schema
const createContentItemSchema = Joi.object({
  contentTypeId: Joi.string().guid({ version: ['uuidv4'] }).required().messages({
    'string.guid': 'Content Type ID must be a valid UUID.',
    'any.required': 'Content Type ID is required.'
  }),
  data: Joi.object().required().messages({
    'object.base': 'Content data must be an object.',
    'any.required': 'Content data is required.'
  }),
  status: Joi.string().valid('draft', 'published', 'archived', 'pending_review').default('draft').messages({
    'any.only': 'Status must be one of "draft", "published", "archived", or "pending_review".'
  }),
}).unknown(false); // Disallow unknown properties in the main content item body

// Base schema for content item update
// Note: 'data' field will be dynamically validated by the service based on ContentType schema
const updateContentItemSchema = Joi.object({
  data: Joi.object().messages({
    'object.base': 'Content data must be an object.'
  }),
  status: Joi.string().valid('draft', 'published', 'archived', 'pending_review').messages({
    'any.only': 'Status must be one of "draft", "published", "archived", or "pending_review".'
  }),
}).min(1).unknown(false); // At least one field is required for update, disallow unknown properties

module.exports = {
  createContentItemSchema,
  updateContentItemSchema,
};
```