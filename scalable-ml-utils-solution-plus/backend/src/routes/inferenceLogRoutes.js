```javascript
const express = require('express');
const inferenceLogController = require('../controllers/inferenceLogController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All inference log routes require authentication
// Only admins or the owner of the model associated with the log should typically access details.
// For simplicity, we'll allow all authenticated users to view logs for now,
// but a real-world scenario might involve more granular checks.
router.use(protect);

router
  .route('/')
  .get(inferenceLogController.getInferenceLogs);

router
  .route('/:id')
  .get(inferenceLogController.getInferenceLog);

module.exports = router;
```