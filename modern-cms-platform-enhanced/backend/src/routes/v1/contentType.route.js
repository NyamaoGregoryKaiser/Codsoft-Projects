```javascript
const express = require('express');
const validate = require('../../utils/joiValidation');
const contentTypeValidation = require('../../validations/contentType.validation');
const contentTypeController = require('../../controllers/contentType.controller');
const auth = require('../../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(contentTypeValidation.createContentType), contentTypeController.createContentType)
  .get(auth('admin', 'editor', 'viewer'), validate(contentTypeValidation.getContentTypes), contentTypeController.getContentTypes);

router
  .route('/:contentTypeId')
  .get(auth('admin', 'editor', 'viewer'), validate(contentTypeValidation.getContentType), contentTypeController.getContentType)
  .patch(auth('admin'), validate(contentTypeValidation.updateContentType), contentTypeController.updateContentType)
  .delete(auth('admin'), validate(contentTypeValidation.deleteContentType), contentTypeController.deleteContentType);

module.exports = router;
```