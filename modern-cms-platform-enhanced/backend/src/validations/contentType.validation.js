```javascript
const Joi = require('joi');
const { ContentType } = require('../models');

const fieldSchema = Joi.object().keys({
  name: Joi.string().required().pattern(/^[a-zA-Z0-9]+$/).messages({
    'string.pattern.base': 'Field name must be alphanumeric without spaces or special characters.',
    'any.required': 'Field name is required.'
  }),
  label: Joi.string().optional(),
  type: Joi.string().valid('text', 'richtext', 'number', 'boolean', 'date', 'media', 'relation').required(),
  required: Joi.boolean().default(false),
  unique: Joi.boolean().default(false),
  // Additional properties for specific types
  targetContentType: Joi.string().uuid().when('type', {
    is: 'relation',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  }),
});

const createContentType = {
  body: Joi.object().keys({
    name: Joi.string().min(2).max(100).required(),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).required().messages({
      'string.pattern.base': 'Slug must be lowercase alphanumeric with hyphens, e.g., "my-content-type".',
      'any.required': 'Slug is required.'
    }),
    description: Joi.string().allow('').optional(),
    fields: Joi.array().items(fieldSchema).min(1).required(),
  }).custom(async (value, helpers) => {
    const existingName = await ContentType.findOne({ where: { name: value.name } });
    if (existingName) {
      return helpers.error('any.custom', { message: 'Content type name already exists' });
    }
    const existingSlug = await ContentType.findOne({ where: { slug: value.slug } });
    if (existingSlug) {
      return helpers.error('any.custom', { message: 'Content type slug already exists' });
    }
    const fieldNames = new Set();
    for (const field of value.fields) {
      if (fieldNames.has(field.name)) {
        return helpers.error('any.custom', { message: `Duplicate field name: ${field.name}` });
      }
      fieldNames.add(field.name);
    }
    return value;
  }),
};

const getContentTypes = {
  query: Joi.object().keys({
    name: Joi.string(),
    slug: Joi.string(),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getContentType = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
  }),
};

const updateContentType = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().min(2).max(100),
    slug: Joi.string().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({
      'string.pattern.base': 'Slug must be lowercase alphanumeric with hyphens, e.g., "my-content-type".'
    }),
    description: Joi.string().allow(''),
    fields: Joi.array().items(fieldSchema).min(1),
  }).min(1).custom(async (value, helpers) => {
    const contentTypeId = helpers.state.ancestors[0].params.contentTypeId;
    if (value.name) {
      const existingName = await ContentType.findOne({ where: { name: value.name } });
      if (existingName && existingName.id !== contentTypeId) {
        return helpers.error('any.custom', { message: 'Content type name already exists' });
      }
    }
    if (value.slug) {
      const existingSlug = await ContentType.findOne({ where: { slug: value.slug } });
      if (existingSlug && existingSlug.id !== contentTypeId) {
        return helpers.error('any.custom', { message: 'Content type slug already exists' });
      }
    }
    if (value.fields) {
      const fieldNames = new Set();
      for (const field of value.fields) {
        if (fieldNames.has(field.name)) {
          return helpers.error('any.custom', { message: `Duplicate field name: ${field.name}` });
        }
        fieldNames.add(field.name);
      }
    }
    return value;
  }),
};

const deleteContentType = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createContentType,
  getContentTypes,
  getContentType,
  updateContentType,
  deleteContentType,
};
```