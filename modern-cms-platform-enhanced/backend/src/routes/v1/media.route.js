```javascript
const express = require('express');
const validate = require('../../utils/joiValidation');
const mediaValidation = require('../../validations/media.validation');
const mediaController = require('../../controllers/media.controller');
const auth = require('../../middleware/auth');
const { cacheMiddleware } = require('../../middleware/cache');

const router = express.Router();

router
  .route('/')
  .post(auth('admin', 'editor'), validate(mediaValidation.createMedia), mediaController.createMedia)
  .get(auth('admin', 'editor', 'viewer'), cacheMiddleware, validate(mediaValidation.getMediaItems), mediaController.getMediaItems);

router
  .route('/:mediaId')
  .get(auth('admin', 'editor', 'viewer'), cacheMiddleware, validate(mediaValidation.getMedia), mediaController.getMedia)
  .patch(auth('admin', 'editor'), validate(mediaValidation.updateMedia), mediaController.updateMedia)
  .delete(auth('admin', 'editor'), validate(mediaValidation.deleteMedia), mediaController.deleteMedia);

module.exports = router;
```