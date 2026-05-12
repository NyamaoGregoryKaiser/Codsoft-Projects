```javascript
const express = require('express');
const validate = require('../../utils/joiValidation');
const entryValidation = require('../../validations/entry.validation');
const entryController = require('../../controllers/entry.controller');
const auth = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

const router = express.Router();

router
  .route('/:contentTypeId/entries')
  .post(auth('admin', 'editor'), validate(entryValidation.createEntry), entryController.createEntry)
  .get(auth('admin', 'editor', 'viewer'), cacheMiddleware, validate(entryValidation.getEntries), entryController.getEntries);

router
  .route('/:contentTypeId/entries/:entryId')
  .get(auth('admin', 'editor', 'viewer'), cacheMiddleware, validate(entryValidation.getEntry), entryController.getEntry)
  .patch(auth('admin', 'editor'), validate(entryValidation.updateEntry), entryController.updateEntry)
  .delete(auth('admin', 'editor'), validate(entryValidation.deleteEntry), entryController.deleteEntry);

module.exports = router;
```