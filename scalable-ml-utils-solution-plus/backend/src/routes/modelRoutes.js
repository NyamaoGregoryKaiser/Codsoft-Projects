```javascript
const express = require('express');
const modelController = require('../controllers/modelController');
const { protect, authorize, restrictToOwner } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // All model routes require authentication

router
  .route('/')
  .get(modelController.getAllModels)
  .post(modelController.createModel); // Any authenticated user can create a model

router
  .route('/:id')
  .get(modelController.getModel)
  .patch(restrictToOwner('Model'), modelController.updateModel) // Only owner or admin can update
  .delete(restrictToOwner('Model'), modelController.deleteModel); // Only owner or admin can delete

// Inference route
router.post('/:id/infer', modelController.runInference); // Any authenticated user can run inference

module.exports = router;
```