const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const scrapedDataService = require('../services/scrapedData.service');
const ApiError = require('../utils/ApiError');
const { getScrapeJobById } = require('../services/scrapeJob.service');

const getScrapedData = catchAsync(async (req, res) => {
  const filter = {};
  const options = {
    limit: req.query.limit || 10,
    page: req.query.page || 1,
    sortBy: req.query.sortBy || 'createdAt:desc',
  };
  // For non-admin, filter by user's associated targets/jobs.
  // This would require joining with ScrapeJob and Target tables to filter by userId.
  // For simplicity, we assume 'getScrapedData' is either admin or filtered implicitly by other routes.
  // A proper implementation would add `where: { '$scrapeJob.userId$': req.user.id }` for non-admins if a join is used.

  const result = await scrapedDataService.queryScrapedData(filter, options);
  res.send(result);
});

const getScrapedDataById = catchAsync(async (req, res) => {
  const data = await scrapedDataService.getScrapedDataById(req.params.dataId);
  // Ensure user has access to the associated job/target
  const job = await getScrapeJobById(data.scrapeJobId);
  if (req.user.role !== 'admin' && job.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this scraped data');
  }
  res.send(data.toJSON());
});

const getScrapedDataByJobId = catchAsync(async (req, res) => {
  const filter = {}; // ScrapedData service handles the job ID filter
  const options = {
    limit: req.query.limit || 10,
    page: req.query.page || 1,
    sortBy: req.query.sortBy || 'createdAt:desc',
  };

  const job = await getScrapeJobById(req.params.jobId);
  if (req.user.role !== 'admin' && job.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this scrape job data');
  }

  const result = await scrapedDataService.getScrapedDataByJobId(req.params.jobId, options);
  res.send(result);
});

module.exports = {
  getScrapedData,
  getScrapedDataById,
  getScrapedDataByJobId,
};