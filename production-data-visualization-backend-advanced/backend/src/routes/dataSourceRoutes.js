const express = require('express');
const dataSourceController = require('../controllers/dataSourceController');
const { protect } = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cachingMiddleware');

const router = express.Router();

// All data source routes require authentication
router.use(protect);

router.route('/')
  .get(cacheMiddleware, dataSourceController.getAllDataSources)
  .post(clearCache, dataSourceController.createDataSource);

router.route('/:id')
  .get(cacheMiddleware, dataSourceController.getDataSource)
  .put(clearCache, dataSourceController.updateDataSource)
  .delete(clearCache, dataSourceController.deleteDataSource);

router.route('/:id/data')
  .get(cacheMiddleware, dataSourceController.getDataSourceData); // Data for a specific data source

module.exports = router;