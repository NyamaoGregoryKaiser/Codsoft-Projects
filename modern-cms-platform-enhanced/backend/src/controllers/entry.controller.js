```javascript
const httpStatus = require('http-status-codes');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const entryService = require('../services/entry.service');
const { clearCacheForPath } = require('../middleware/cache'); // Import cache utility

const createEntry = catchAsync(async (req, res, next) => {
  const entry = await entryService.createEntry(req.params.contentTypeId, req.body, req.user.id);
  // Invalidate cache for entries list of this content type
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries`)(req, res, () => {});
  res.status(httpStatus.CREATED).send(entry.toJSON());
});

const getEntries = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['status']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await entryService.queryEntries(req.params.contentTypeId, filter, options);
  res.send(result);
});

const getEntry = catchAsync(async (req, res) => {
  const entry = await entryService.getEntryById(req.params.contentTypeId, req.params.entryId);
  res.send(entry.toJSON());
});

const updateEntry = catchAsync(async (req, res, next) => {
  const entry = await entryService.updateEntryById(req.params.contentTypeId, req.params.entryId, req.body);
  // Invalidate cache for this entry and the entries list of its content type
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries`)(req, res, () => {});
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries/${req.params.entryId}`)(req, res, () => {});
  res.send(entry.toJSON());
});

const deleteEntry = catchAsync(async (req, res, next) => {
  await entryService.deleteEntryById(req.params.contentTypeId, req.params.entryId);
  // Invalidate cache for this entry and the entries list of its content type
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries`)(req, res, () => {});
  clearCacheForPath(`/v1/content-types/${req.params.contentTypeId}/entries/${req.params.entryId}`)(req, res, () => {});
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createEntry,
  getEntries,
  getEntry,
  updateEntry,
  deleteEntry,
};
```