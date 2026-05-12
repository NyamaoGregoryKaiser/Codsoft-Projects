```javascript
const httpStatus = require('http-status-codes');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const mediaService = require('../services/media.service');
const { clearCacheForPath } = require('../middleware/cache');

const createMedia = catchAsync(async (req, res, next) => {
  // In a real application, file upload middleware (e.g., multer) would process the file
  // req.file would contain details, and the file would be saved to a persistent storage (S3, GCS, local)
  // For this example, we assume req.body already contains the 'filename', 'path', 'mimeType', 'size'
  // as if it was already uploaded and processed.
  const mediaBody = req.body; // In a real app, this would be constructed from req.file or req.body for metadata
  const media = await mediaService.createMedia(mediaBody, req.user.id);
  clearCacheForPath('/v1/media')(req, res, () => {});
  res.status(httpStatus.CREATED).send(media.toJSON());
});

const getMediaItems = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'mimeType']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await mediaService.queryMediaItems(filter, options);
  res.send(result);
});

const getMedia = catchAsync(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.mediaId);
  if (!media) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Media item not found');
  }
  res.send(media.toJSON());
});

const updateMedia = catchAsync(async (req, res, next) => {
  const media = await mediaService.updateMediaById(req.params.mediaId, req.body);
  clearCacheForPath('/v1/media')(req, res, () => {});
  clearCacheForPath(`/v1/media/${req.params.mediaId}`)(req, res, () => {});
  res.send(media.toJSON());
});

const deleteMedia = catchAsync(async (req, res, next) => {
  await mediaService.deleteMediaById(req.params.mediaId);
  clearCacheForPath('/v1/media')(req, res, () => {});
  clearCacheForPath(`/v1/media/${req.params.mediaId}`)(req, res, () => {});
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createMedia,
  getMediaItems,
  getMedia,
  updateMedia,
  deleteMedia,
};
```