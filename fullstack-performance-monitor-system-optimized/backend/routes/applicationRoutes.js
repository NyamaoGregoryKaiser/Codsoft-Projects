```javascript
const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const { authenticateToken, authorizeApplicationOwner } = require('../middleware/authMiddleware');

// All application routes require user authentication
router.use(authenticateToken);

// Get all applications for the authenticated user
router.get('/', applicationController.getUserApplications);
// Create a new application
router.post('/', applicationController.createApplication);

// Routes specific to a single application, requiring ownership authorization
router.route('/:appId')
  .get(authorizeApplicationOwner, applicationController.getApplication)
  .patch(authorizeApplicationOwner, applicationController.updateApplication)
  .delete(authorizeApplicationOwner, applicationController.deleteApplication);

// Regenerate API key for a specific application
router.post('/:appId/regenerate-api-key', authorizeApplicationOwner, applicationController.regenerateApiKey);

module.exports = router;
```