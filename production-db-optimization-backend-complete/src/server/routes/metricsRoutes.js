const express = require('express');
const {
  getLiveMetrics,
  getMetricsHistory,
  recordMetrics,
} = require('../controllers/metricsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect); // All metrics routes require authentication

router.get('/:connectionId/live', getLiveMetrics);
router.get('/:connectionId/history', getMetricsHistory);
router.post('/:connectionId/record', recordMetrics); // For manual trigger or scheduled tasks

module.exports = router;