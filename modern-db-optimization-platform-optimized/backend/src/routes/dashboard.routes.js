const express = require('express');
const DashboardController = require('../controllers/dashboard.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate);

router.get('/summary', DashboardController.getDashboardSummary);
router.get('/:id/metrics', DashboardController.getConnectionMetrics); // Get metrics for a specific connection

module.exports = router;