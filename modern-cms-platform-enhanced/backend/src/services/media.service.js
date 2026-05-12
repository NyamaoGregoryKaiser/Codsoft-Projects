```javascript
const httpStatus = require('http-status-codes');
const { Media } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Create a media item (simplified, assuming upload handled externally)
 * @param {Object} mediaBody
 * @param {UUID} userId
 * @returns {Promise<Media>}
 */
const createMedia = async (mediaBody, userId) => {
  // In a real app, 'filename' would come from an actual upload process (e.g., multer)
  // 'path' would be the URL to the stored file (e.g., S3 URL, local static URL)
  // We'll enforce filename uniqueness here.
  if (await Media.findOne({ where: { filename: mediaBody.filename } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A media item with this filename already exists');
  }
  return Media.create({ ...mediaBody, userId });
};

/**
 * Query for media items
 * @param {Object} filter - Sequelize filter
 * @param {Object} options - Query options (limit, page, sortBy)
 * @returns {Promise<QueryResult>}
 */
const queryMediaItems = async (filter, options) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const offset = (page - 1) * limit;

  const order = sortBy.split(',').map((sortOption) => {
    const [field, sortOrder] = sortOption.split(':');
    return [field, sortOrder.toUpperCase()];
  });

  const { count, rows } = await Media.findAndCountAll({
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
 * Get media item by ID
 * @param {UUID} mediaId
 * @returns {Promise<Media>}
 */
const getMediaById = async (mediaId) => {
  return Media.findByPk(mediaId);
};

/**
 * Update media item by ID
 * @param {UUID} mediaId
 * @param {Object} updateBody
 * @returns {Promise<Media>}
 */
const updateMediaById = async (mediaId, updateBody) => {
  const media = await getMediaById(mediaId);
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Media item not found');
  }
  // If filename is updated, ensure uniqueness
  if (updateBody.filename && (await Media.findOne({ where: { filename: updateBody.filename } })) && (await Media.findOne({ where: { filename: updateBody.filename } })).id !== mediaId) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'A media item with this filename already exists');
  }

  Object.assign(media, updateBody);
  await media.save();
  return media;
};

/**
 * Delete media item by ID
 * @param {UUID} mediaId
 * @returns {Promise<Media>}
 */
const deleteMediaById = async (mediaId) => {
  const media = await getMediaById(mediaId);
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Media item not found');
  }
  await media.destroy();
  return media;
};

module.exports = {
  createMedia,
  queryMediaItems,
  getMediaById,
  updateMediaById,
  deleteMediaById,
};
```