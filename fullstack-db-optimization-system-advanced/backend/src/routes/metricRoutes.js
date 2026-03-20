const express = require('express');
const router = express.Router();
const { getLatestMetrics, getMetricHistory } = require('@controllers/metricController');
const { protect, authorize } = require('@middleware/authMiddleware');

router.get('/:dbInstanceId/latest', protect, getLatestMetrics);
router.get('/:dbInstanceId/history', protect, getMetricHistory);

module.exports = router;