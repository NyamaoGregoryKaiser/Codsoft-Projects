```javascript
const httpStatus = require('http-status-codes');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const contentTypeService = require('../services/contentType.service');
const { clearCacheForPath } = require('../middleware/cache'); // Import cache utility

const createContentType = catchAsync(async (req, res, next) => {
  const contentType = await contentTypeService.createContentType(req.body);
  // Invalidate cache for content types list and potentially public routes if dynamic routing is used
  clearCacheForPath('/v1/content-types')(req, res, () => {}); // Clear specific cache
  res.status(httpStatus.CREATED).send(contentType.toJSON());
});

const getContentTypes = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'slug']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await contentTypeService.queryContentTypes(filter, options);
  res.send(result);
});

const getContentType = catchAsync(async (req, res) => {
  const contentType = await contentTypeService.getContentTypeById(req.params.contentTypeId);
  if (!contentType) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Content type not found');
  }
  res.send(contentType.toJSON());
});

const updateContentType = catchAsync(async (req, res, next) => {
  const contentType = await contentTypeService.updateContentTypeById(req.params.contentTypeId, req.body);
  // Invalidate cache for this specific content type and its entries
  clearCacheForPath('/v1/content-types')(req, res, () => {});
  clearCacheForPath(`/v1/content-types/${contentType.id}/entries`)(req, res, () => {});
  res.send(contentType.toJSON());
});

const deleteContentType = catchAsync(async (req, res, next) => {
  await contentTypeService.deleteContentTypeById(req.params.contentTypeId);
  // Invalidate cache for content types list and potentially public routes
  clearCacheForPath('/v1/content-types')(req, res, () => {});
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries`)(req, res, () => {}); // Clear entries cache
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createContentType,
  getContentTypes,
  getContentType,
  updateContentType,
  deleteContentType,
};
```