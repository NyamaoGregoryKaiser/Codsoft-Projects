const express = require('express');
const auth = require('../middlewares/auth.middleware');
const scrapeJobController = require('../controllers/scrapeJob.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageScrapeJobs'), scrapeJobController.createScrapeJob)
  .get(auth('getScrapeJobs'), scrapeJobController.getScrapeJobs);

router.post('/:targetId/run', auth('manageScrapeJobs'), scrapeJobController.runScrapeJobForTarget);


router
  .route('/:jobId')
  .get(auth('getScrapeJobs'), scrapeJobController.getScrapeJob)
  .patch(auth('manageScrapeJobs'), scrapeJobController.updateScrapeJob) // Mainly for status updates
  .delete(auth('manageScrapeJobs'), scrapeJobController.deleteScrapeJob);

module.exports = router;