const express = require('express');
const chartController = require('../controllers/chartController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cachingMiddleware');

const router = express.Router();

// All chart routes require authentication
router.use(protect);

router.route('/')
  .get(cacheMiddleware, chartController.getAllCharts)
  .post(clearCache, chartController.createChart);

router.route('/:id')
  .get(cacheMiddleware, chartController.getChart)
  .put(clearCache, chartController.updateChart)
  .delete(clearCache, chartController.deleteChart);

router.route('/:id/data')
  .get(cacheMiddleware, chartController.getChartData); // Fetch data *and* config for rendering

module.exports = router;