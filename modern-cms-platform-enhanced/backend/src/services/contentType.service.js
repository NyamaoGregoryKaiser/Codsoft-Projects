```javascript
const httpStatus = require('http-status-codes');
const { ContentType, Entry } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a content type
 * @param {Object} contentTypeBody
 * @returns {Promise<ContentType>}
 */
const createContentType = async (contentTypeBody) => {
  if (await ContentType.findOne({ where: { name: contentTypeBody.name } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Content type name already exists');
  }
  if (await ContentType.findOne({ where: { slug: contentTypeBody.slug } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Content type slug already exists');
  }
  return ContentType.create(contentTypeBody);
};

/**
 * Query for content types
 * @param {Object} filter - Sequelize filter
 * @param {Object} options - Query options (limit, page, sortBy)
 * @returns {Promise<QueryResult>}
 */
const queryContentTypes = async (filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const order = sortBy.split(',').map((sortOption) => {
    const [field, sortOrder] = sortOption.split(':');
    return [field, sortOrder.toUpperCase()];
  });

  const { count, rows } = await ContentType.findAndCountAll({
    where: filter,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: order,
  });

  return {
    results: rows,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    totalPages: Math.ceil(count / limit),
    totalResults: count,
  };
};

/**
 * Get content type by ID
 * @param {UUID} id
 * @returns {Promise<ContentType>}
 */
const getContentTypeById = async (id) => {
  return ContentType.findByPk(id);
};

/**
 * Get content type by Slug
 * @param {string} slug
 * @returns {Promise<ContentType>}
 */
const getContentTypeBySlug = async (slug) => {
  return ContentType.findOne({ where: { slug } });
};

/**
 * Update content type by ID
 * @param {UUID} contentTypeId
 * @param {Object} updateBody
 * @returns {Promise<ContentType>}
 */
const updateContentTypeById = async (contentTypeId, updateBody) => {
  const contentType = await getContentTypeById(contentTypeId);
  if (!contentType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }
  if (updateBody.name && (await ContentType.findOne({ where: { name: updateBody.name } })) && (await ContentType.findOne({ where: { name: updateBody.name } })).id !== contentTypeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Content type name already exists');
  }
  if (updateBody.slug && (await ContentType.findOne({ where: { slug: updateBody.slug } })) && (await ContentType.findOne({ where: { slug: updateBody.slug } })).id !== contentTypeId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Content type slug already exists');
  }

  // Prevent field type changes if entries exist for this content type
  if (updateBody.fields && JSON.stringify(contentType.fields) !== JSON.stringify(updateBody.fields)) {
    const entryCount = await Entry.count({ where: { contentTypeId } });
    if (entryCount > 0) {
      // Basic check: more robust would be to compare schema changes (field name/type/required change)
      // and only allow non-breaking changes. For now, disallow any field change if entries exist.
      throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot modify content type fields because entries exist for this type. Please delete all entries first.');
    }
  }

  Object.assign(contentType, updateBody);
  await contentType.save();
  return contentType;
};

/**
 * Delete content type by ID
 * @param {UUID} contentTypeId
 * @returns {Promise<ContentType>}
 */
const deleteContentTypeById = async (contentTypeId) => {
  const contentType = await getContentTypeById(contentTypeId);
  if (!contentType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }
  const entryCount = await Entry.count({ where: { contentTypeId } });
  if (entryCount > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot delete content type because entries exist for this type.');
  }
  await contentType.destroy();
  return contentType;
};

module.exports = {
  createContentType,
  queryContentTypes,
  getContentTypeById,
  getContentTypeBySlug,
  updateContentTypeById,
  deleteContentTypeById,
};
```