```javascript
const { ContentItem, ContentType, User } = require('../db/models');
const { createError } = require('../utils/errorHandler');
const logger = require('../utils/logger');
const Joi = require('joi'); // For dynamic schema validation

/**
 * Validates content data against its ContentType schema.
 * @param {object} contentTypeSchema - The schema definition from ContentType.fields.
 * @param {object} data - The content item data to validate.
 * @returns {Promise<object>} The validated data.
 * @throws {Error} If validation fails.
 */
const validateContentData = async (contentTypeSchema, data) => {
  const joiSchemaFields = {};

  if (!contentTypeSchema || !Array.isArray(contentTypeSchema)) {
    throw createError(500, 'Content type schema is invalid.');
  }

  contentTypeSchema.forEach(field => {
    let fieldSchema;
    switch (field.type) {
      case 'string':
        fieldSchema = Joi.string();
        break;
      case 'text':
        fieldSchema = Joi.string(); // Treat text as string
        break;
      case 'number':
        fieldSchema = Joi.number();
        break;
      case 'boolean':
        fieldSchema = Joi.boolean();
        break;
      case 'date':
        fieldSchema = Joi.date();
        break;
      case 'json':
        fieldSchema = Joi.object(); // For complex JSON fields
        break;
      case 'media': // Assuming media refers to an array of media IDs or URLs
        fieldSchema = Joi.array().items(Joi.string().uuid());
        break;
      case 'relation': // For relating to other content items or users
          fieldSchema = Joi.string().uuid(); // Assuming UUID for related item ID
          break;
      default:
        fieldSchema = Joi.any();
    }
    if (field.required) {
      fieldSchema = fieldSchema.required();
    }
    if (field.defaultValue !== undefined) {
      fieldSchema = fieldSchema.default(field.defaultValue);
    }
    joiSchemaFields[field.name] = fieldSchema.label(field.label || field.name);
  });

  const schema = Joi.object(joiSchemaFields).unknown(true); // Allow unknown fields for flexibility, or set to false for strict validation

  try {
    return await schema.validateAsync(data, { abortEarly: false });
  } catch (validationError) {
    logger.error('Content data validation failed:', validationError.details);
    throw createError(400, `Content data validation failed: ${validationError.details.map(d => d.message).join(', ')}`);
  }
};

/**
 * Get all content items.
 * @param {string} [contentTypeId] - Optional ContentType ID to filter.
 * @param {number} [limit=10] - Number of items to return.
 * @param {number} [offset=0] - Number of items to skip.
 * @returns {Promise<object[]>} Array of content items.
 */
exports.getAllContentItems = async (contentTypeId, limit, offset) => {
  const where = contentTypeId ? { contentTypeId } : {};
  return ContentItem.findAndCountAll({
    where,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    include: [
      { model: ContentType, as: 'ContentType' },
      { model: User, as: 'Author', attributes: ['id', 'username', 'email'] }
    ],
    order: [['createdAt', 'DESC']]
  });
};

/**
 * Get a single content item by ID.
 * @param {string} id - Content item ID.
 * @returns {Promise<object|null>} Content item object or null.
 */
exports.getContentItemById = async (id) => {
  return ContentItem.findByPk(id, {
    include: [
      { model: ContentType, as: 'ContentType' },
      { model: User, as: 'Author', attributes: ['id', 'username', 'email'] }
    ]
  });
};

/**
 * Create a new content item.
 * @param {string} contentTypeId - The ID of the content type.
 * @param {object} data - The content data.
 * @param {string} authorId - The ID of the user creating the content.
 * @param {string} [status='draft'] - The status of the content item.
 * @returns {Promise<object>} The created content item.
 * @throws {Error} If content type not found or validation fails.
 */
exports.createContentItem = async (contentTypeId, data, authorId, status = 'draft') => {
  const contentType = await ContentType.findByPk(contentTypeId);
  if (!contentType) {
    throw createError(404, `Content Type with ID ${contentTypeId} not found.`);
  }

  // Validate the incoming data against the ContentType's schema
  const validatedData = await validateContentData(contentType.fields, data);

  const contentItem = await ContentItem.create({
    contentTypeId,
    data: validatedData,
    authorId,
    status
  });

  logger.info(`Content item created: ${contentItem.id} for content type ${contentType.name}`);
  return contentItem;
};

/**
 * Update an existing content item.
 * @param {string} id - Content item ID.
 * @param {object} data - The content data to update.
 * @param {string} updaterId - The ID of the user updating the content.
 * @param {string} [status] - The new status of the content item.
 * @returns {Promise<object|null>} The updated content item or null if not found.
 * @throws {Error} If content type not found or validation fails.
 */
exports.updateContentItem = async (id, data, updaterId, status) => {
  const contentItem = await ContentItem.findByPk(id, {
    include: [{ model: ContentType, as: 'ContentType' }]
  });

  if (!contentItem) {
    return null;
  }

  // Validate the incoming data against the ContentType's schema
  const validatedData = await validateContentData(contentItem.ContentType.fields, data);

  contentItem.data = { ...contentItem.data, ...validatedData }; // Merge existing data with new data
  contentItem.updatedBy = updaterId;
  if (status) {
    contentItem.status = status;
  }

  await contentItem.save();
  logger.info(`Content item updated: ${contentItem.id}`);
  return contentItem;
};

/**
 * Delete a content item.
 * @param {string} id - Content item ID.
 * @returns {Promise<boolean>} True if deleted, false otherwise.
 */
exports.deleteContentItem = async (id) => {
  const result = await ContentItem.destroy({ where: { id } });
  if (result === 1) {
    logger.info(`Content item deleted: ${id}`);
    return true;
  }
  return false;
};
```