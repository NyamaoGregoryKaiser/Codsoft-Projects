const express = require('express');
const auth = require('../middlewares/auth.middleware');
const scrapedDataController = require('../controllers/scrapedData.controller');
const cacheMiddleware = require('../middlewares/cache.middleware');

const router = express.Router();

router
  .route('/')
  .get(auth('getScrapedData'), cacheMiddleware('scraped_data_list'), scrapedDataController.getScrapedData);

router
  .route('/:dataId')
  .get(auth('getScrapedData'), scrapedDataController.getScrapedDataById);

router
  .route('/job/:jobId')
  .get(auth('getScrapedData'), cacheMiddleware('scraped_data_job'), scrapedDataController.getScrapedDataByJobId);

module.exports = router;