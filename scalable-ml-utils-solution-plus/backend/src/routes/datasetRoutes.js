```javascript
const express = require('express');
const datasetController = require('../controllers/datasetController');
const { protect, authorize, restrictToOwner } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All dataset routes require authentication

router
  .route('/')
  .get(datasetController.getAllDatasets)
  .post(datasetController.createDataset); // Any authenticated user can create a dataset

router
  .route('/:id')
  .get(datasetController.getDataset)
  .patch(restrictToOwner('Dataset'), datasetController.updateDataset) // Only owner or admin can update
  .delete(restrictToOwner('Dataset'), datasetController.deleteDataset); // Only owner or admin can delete

module.exports = router;
```