```javascript
const express = require('express');
const router = express.Router();
const metricController = require('../controllers/metricController');
const { authenticateToken, authorizeApplicationOwner, authenticateApiKey } = require('../middleware/authMiddleware');
const { metricRateLimiter } = require('../middleware/rateLimitMiddleware');

// --- Public endpoint for collecting metrics (API Key protected) ---
// Apply a specific rate limit for metric collection
router.post('/collect', metricRateLimiter, authenticateApiKey, metricController.collectMetric);

// --- Authenticated endpoints for viewing/managing metrics and alerts (User JWT protected) ---
router.use(authenticateToken);

// Get metrics for a specific application and metric type
router.get('/:appId/data/:metricType', authorizeApplicationOwner, metricController.getMetrics);

// Get all alerts for a specific application
router.get('/:appId/alerts', authorizeApplicationOwner, metricController.getAlerts);

// Create a new alert for an application
router.post('/:appId/alerts', authorizeApplicationOwner, metricController.createAlert);

// Update or delete a specific alert (requires app ownership, implicitly handled by checking alert.applicationId)
router.route('/alerts/:alertId')
  // We need to fetch the alert first to check its application ID, then check owner
  .patch(async (req, res, next) => {
    const { Alert } = require('../models'); // Import here to avoid circular dependency
    const alert = await Alert.findByPk(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }
    req.params.appId = alert.applicationId; // Set appId for the authorizeApplicationOwner middleware
    next();
  }, authorizeApplicationOwner, metricController.updateAlert)
  .delete(async (req, res, next) => {
    const { Alert } = require('../models');
    const alert = await Alert.findByPk(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found.' });
    }
    req.params.appId = alert.applicationId;
    next();
  }, authorizeApplicationOwner, metricController.deleteAlert);

module.exports = router;
```