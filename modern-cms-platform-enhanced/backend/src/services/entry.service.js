```javascript
const httpStatus = require('http-status-codes');
const { Entry, ContentType } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create an entry
 * @param {UUID} contentTypeId
 * @param {Object} entryBody
 * @param {UUID} userId
 * @returns {Promise<Entry>}
 */
const createEntry = async (contentTypeId, entryBody, userId) => {
  const contentType = await ContentType.findByPk(contentTypeId);
  if (!contentType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }

  // Additional validation for uniqueness if specified in content type fields
  for (const field of contentType.fields) {
    if (field.unique && entryBody.data[field.name]) {
      const existingEntry = await Entry.findOne({
        where: {
          contentTypeId,
          [`data.${field.name}`]: entryBody.data[field.name],
        },
      });
      if (existingEntry) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Field '${field.name}' must be unique`);
      }
    }
  }

  return Entry.create({ ...entryBody, contentTypeId, userId });
};

/**
 * Query for entries
 * @param {UUID} contentTypeId
 * @param {Object} filter - Sequelize filter
 * @param {Object} options - Query options (limit, page, sortBy)
 * @returns {Promise<QueryResult>}
 */
const queryEntries = async (contentTypeId, filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const order = sortBy.split(',').map((sortOption) => {
    const [field, sortOrder] = sortOption.split(':');
    return [field, sortOrder.toUpperCase()];
  });

  const finalFilter = { contentTypeId, ...filter };

  const { count, rows } = await Entry.findAndCountAll({
    where: finalFilter,
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
    order: order,
    include: [{ model: ContentType, as: 'contentType', attributes: ['name', 'slug'] }],
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
 * Get entry by ID
 * @param {UUID} contentTypeId
 * @param {UUID} entryId
 * @returns {Promise<Entry>}
 */
const getEntryById = async (contentTypeId, entryId) => {
  const entry = await Entry.findOne({
    where: { id: entryId, contentTypeId },
    include: [{ model: ContentType, as: 'contentType' }],
  });
  if (!entry) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Entry not found for this content type');
  }
  return entry;
};

/**
 * Update entry by ID
 * @param {UUID} contentTypeId
 * @param {UUID} entryId
 * @param {Object} updateBody
 * @returns {Promise<Entry>}
 */
const updateEntryById = async (contentTypeId, entryId, updateBody) => {
  const entry = await getEntryById(contentTypeId, entryId);
  const contentType = await ContentType.findByPk(contentTypeId); // Re-fetch to get fields
  if (!contentType) { // Should not happen if getEntryById succeeded but good for safety
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }

  // Additional validation for uniqueness if specified in content type fields
  if (updateBody.data) {
    for (const field of contentType.fields) {
      if (field.unique && updateBody.data[field.name] !== undefined && updateBody.data[field.name] !== entry.data[field.name]) {
        const existingEntry = await Entry.findOne({
          where: {
            contentTypeId,
            [`data.${field.name}`]: updateBody.data[field.name],
          },
        });
        if (existingEntry && existingEntry.id !== entryId) {
          throw new ApiError(httpStatus.BAD_REQUEST, `Field '${field.name}' must be unique`);
        }
      }
    }
  }

  Object.assign(entry, updateBody);
  await entry.save();
  return entry;
};

/**
 * Delete entry by ID
 * @param {UUID} contentTypeId
 * @param {UUID} entryId
 * @returns {Promise<Entry>}
 */
const deleteEntryById = async (contentTypeId, entryId) => {
  const entry = await getEntryById(contentTypeId, entryId);
  await entry.destroy();
  return entry;
};

module.exports = {
  createEntry,
  queryEntries,
  getEntryById,
  updateEntryById,
  deleteEntryById,
};
```