```javascript
const Joi = require('joi');
const httpStatus = require('http-status-codes');
const { ContentType } = require('../models');
const ApiError = require('../utils/ApiError');

// Helper function to dynamically build Joi schema for entry data
const buildEntryDataSchema = async (contentTypeId) => {
  const contentType = await ContentType.findByPk(contentTypeId);
  if (!contentType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }

  const fieldsSchema = {};
  for (const field of contentType.fields) {
    let joiField;
    switch (field.type) {
      case 'text':
        joiField = Joi.string();
        break;
      case 'richtext':
        joiField = Joi.string(); // Can be more specific with HTML validation if needed
        break;
      case 'number':
        joiField = Joi.number();
        break;
      case 'boolean':
        joiField = Joi.boolean();
        break;
      case 'date':
        joiField = Joi.date();
        break;
      case 'media':
        joiField = Joi.string().uri(); // Expecting a URL for media
        break;
      case 'relation':
        joiField = Joi.string().uuid(); // Expecting UUID of related entry
        break;
      default:
        joiField = Joi.any();
    }
    if (field.required) {
      joiField = joiField.required();
    } else {
      joiField = joiField.optional().allow(null, '');
    }
    fieldsSchema[field.name] = joiField;
  }
  return Joi.object(fieldsSchema);
};

const createEntry = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
    data: Joi.object().required().custom(async (value, helpers) => {
      const { contentTypeId } = helpers.state.ancestors[0].params;
      const dataSchema = await buildEntryDataSchema(contentTypeId);
      const { error } = dataSchema.validate(value);
      if (error) {
        return helpers.error('any.custom', { message: `Invalid entry data: ${error.details[0].message}` });
      }
      return value;
    }),
  }),
};

const getEntries = {
  query: Joi.object().keys({
    status: Joi.string().valid('draft', 'published', 'archived'),
    sortBy: Joi.string(),
    limit: Joi.number().integer(),
    page: Joi.number().integer(),
  }),
};

const getEntry = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
    entryId: Joi.string().uuid().required(),
  }),
};

const updateEntry = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
    entryId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('draft', 'published', 'archived'),
    data: Joi.object().custom(async (value, helpers) => {
      const { contentTypeId } = helpers.state.ancestors[0].params;
      const dataSchema = await buildEntryDataSchema(contentTypeId);
      const { error } = dataSchema.validate(value);
      if (error) {
        return helpers.error('any.custom', { message: `Invalid entry data: ${error.details[0].message}` });
      }
      return value;
    }),
  }).min(1),
};

const deleteEntry = {
  params: Joi.object().keys({
    contentTypeId: Joi.string().uuid().required(),
    entryId: Joi.string().uuid().required(),
  }),
};

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
};
```