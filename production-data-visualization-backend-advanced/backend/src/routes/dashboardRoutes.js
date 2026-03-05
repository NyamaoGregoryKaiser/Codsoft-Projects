const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cachingMiddleware');

const router = express.Router();

// All dashboard routes require authentication
router.use(protect);

router.route('/')
  .get(cacheMiddleware, dashboardController.getAllDashboards)
  .post(clearCache, dashboardController.createDashboard);

router.route('/:id')
  .get(cacheMiddleware, dashboardController.getDashboard)
  .put(clearCache, dashboardController.updateDashboard)
  .delete(clearCache, dashboardController.deleteDashboard);

module.exports = router;