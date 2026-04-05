const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const scrapeJobService = require('../services/scrapeJob.service');
const ApiError = require('../utils/ApiError');

const createScrapeJob = catchAsync(async (req, res) => {
  // This controller endpoint is mainly for creating a job *record* without triggering it
  // Actual triggering is often via schedule or specific 'run' endpoint
  const job = await scrapeJobService.createScrapeJobRecord(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(job.toJSON());
});

const runScrapeJobForTarget = catchAsync(async (req, res) => {
  const bullMqJob = await scrapeJobService.triggerImmediateScrapeForTarget(req.params.targetId, req.user.id);
  res.status(httpStatus.ACCEPTED).send({
    message: 'Scrape job enqueued successfully.',
    bullMqJobId: bullMqJob.id,
    targetId: req.params.targetId,
  });
});

const getScrapeJobs = catchAsync(async (req, res) => {
  const filter = {};
  const options = {
    limit: req.query.limit || 10,
    page: req.query.page || 1,
    sortBy: req.query.sortBy || 'createdAt:desc',
  };
  if (req.user.role !== 'admin') {
    filter.userId = req.user.id;
  }
  if (req.query.targetId) filter.targetId = req.query.targetId;
  if (req.query.status) filter.status = req.query.status;

  const result = await scrapeJobService.queryScrapeJobs(filter, options);
  res.send(result);
});

const getScrapeJob = catchAsync(async (req, res) => {
  const job = await scrapeJobService.getScrapeJobById(req.params.jobId);
  if (req.user.role !== 'admin' && job.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this scrape job');
  }
  res.send(job.toJSON());
});

const updateScrapeJob = catchAsync(async (req, res) => {
  const job = await scrapeJobService.getScrapeJobById(req.params.jobId);
  if (req.user.role !== 'admin' && job.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this scrape job');
  }
  const updatedJob = await scrapeJobService.updateScrapeJobById(req.params.jobId, req.body);
  res.send(updatedJob.toJSON());
});

const deleteScrapeJob = catchAsync(async (req, res) => {
  const job = await scrapeJobService.getScrapeJobById(req.params.jobId);
  if (req.user.role !== 'admin' && job.userId !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden access to this scrape job');
  }
  await scrapeJobService.deleteScrapeJobById(req.params.jobId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createScrapeJob,
  runScrapeJobForTarget,
  getScrapeJobs,
  getScrapeJob,
  updateScrapeJob,
  deleteScrapeJob,
};