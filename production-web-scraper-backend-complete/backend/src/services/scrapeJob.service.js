const httpStatus = require('http-status');
const { ScrapeJob, ScrapedData, Target } = require('../db/models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const { addImmediateScrapeJob } = require('./jobScheduler.service');

/**
 * Create a scrape job record manually (e.g. for a scheduled job initial creation)
 * This is different from triggering a job via BullMQ.
 * @param {Object} jobBody
 * @param {string} userId
 * @returns {Promise<ScrapeJob>}
 */
const createScrapeJobRecord = async (jobBody, userId) => {
  const scrapeJob = await ScrapeJob.create({ ...jobBody, userId, status: 'pending' });
  return scrapeJob;
};

/**
 * Trigger an immediate scrape job for a specific target.
 * @param {string} targetId
 * @param {string} userId
 * @returns {Promise<Object>} The BullMQ job object
 */
const triggerImmediateScrapeForTarget = async (targetId, userId) => {
  const target = await Target.findByPk(targetId);
  if (!target) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Target not found');
  }

  // BullMQ job creation will handle the DB record for this run
  const bullMqJob = await addImmediateScrapeJob(targetId, userId);
  return bullMqJob;
};


/**
 * Query for scrape jobs
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryScrapeJobs = async (filter, options) => {
  const jobs = await ScrapeJob.findAndCountAll({
    where: filter,
    limit: options.limit,
    offset: (options.page - 1) * options.limit,
    order: options.sortBy ? [options.sortBy.split(':')] : [['createdAt', 'DESC']],
    include: [{ model: Target, as: 'target', attributes: ['name', 'url'] }]
  });
  return jobs;
};

/**
 * Get scrape job by ID
 * @param {string} jobId
 * @returns {Promise<ScrapeJob>}
 */
const getScrapeJobById = async (jobId) => {
  const job = await ScrapeJob.findByPk(jobId, {
    include: [{ model: Target, as: 'target', attributes: ['name', 'url'] }]
  });
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Scrape job not found');
  }
  return job;
};

/**
 * Update scrape job by ID (mainly for admin to change status manually if needed)
 * @param {string} jobId
 * @param {Object} updateBody
 * @returns {Promise<ScrapeJob>}
 */
const updateScrapeJobById = async (jobId, updateBody) => {
  const job = await getScrapeJobById(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Scrape job not found');
  }
  Object.assign(job, updateBody);
  await job.save();
  return job;
};

/**
 * Delete scrape job by ID (and associated scraped data)
 * @param {string} jobId
 * @returns {Promise<ScrapeJob>}
 */
const deleteScrapeJobById = async (jobId) => {
  const job = await getScrapeJobById(jobId);
  if (!job) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Scrape job not found');
  }
  await ScrapedData.destroy({ where: { scrapeJobId: jobId } }); // Delete associated data
  await job.destroy();
  return job;
};

module.exports = {
  createScrapeJobRecord,
  triggerImmediateScrapeForTarget,
  queryScrapeJobs,
  getScrapeJobById,
  updateScrapeJobById,
  deleteScrapeJobById,
};