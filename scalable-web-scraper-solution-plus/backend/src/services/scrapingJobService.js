```javascript
const { ScrapingJob, ScrapingResult } = require('../models');
const { scrapePage } = require('./scrapingService');
const logger = require('../utils/logger');
const schedulerService = require('./schedulerService'); // Import scheduler

/**
 * Creates a new scraping job.
 * @param {Object} jobData - Data for the new job.
 * @param {string} userId - ID of the user creating the job.
 * @returns {Promise<Object>} The created scraping job.
 */
const createScrapingJob = async (jobData, userId) => {
  const job = await ScrapingJob.create({ ...jobData, userId });
  if (job.schedule) {
    schedulerService.addJobToScheduler(job); // Add to scheduler immediately
  }
  logger.info(`Scraping job created: ${job.id} by user: ${userId}`);
  return job;
};

/**
 * Gets all scraping jobs for a user.
 * @param {string} userId - ID of the user.
 * @returns {Promise<Array<Object>>} List of scraping jobs.
 */
const getScrapingJobs = async (userId) => {
  const jobs = await ScrapingJob.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']]
  });
  return jobs;
};

/**
 * Gets a single scraping job by ID.
 * @param {string} jobId - ID of the job.
 * @param {string} userId - ID of the user (for authorization).
 * @returns {Promise<Object>} The scraping job.
 * @throws {Error} If job not found or user not authorized.
 */
const getScrapingJobById = async (jobId, userId) => {
  const job = await ScrapingJob.findOne({
    where: { id: jobId, userId },
  });
  if (!job) {
    throw new Error('Scraping job not found or unauthorized');
  }
  return job;
};

/**
 * Updates an existing scraping job.
 * @param {string} jobId - ID of the job to update.
 * @param {Object} jobData - Data to update.
 * @param {string} userId - ID of the user (for authorization).
 * @returns {Promise<Object>} The updated scraping job.
 * @throws {Error} If job not found or user not authorized.
 */
const updateScrapingJob = async (jobId, jobData, userId) => {
  const job = await ScrapingJob.findOne({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error('Scraping job not found or unauthorized');
  }

  const oldSchedule = job.schedule;

  Object.assign(job, jobData);
  await job.save();

  // If schedule changed, update in scheduler
  if (job.schedule !== oldSchedule) {
    schedulerService.removeJobFromScheduler(jobId);
    if (job.schedule) {
      schedulerService.addJobToScheduler(job);
    }
  }

  logger.info(`Scraping job updated: ${job.id}`);
  return job;
};

/**
 * Deletes a scraping job.
 * @param {string} jobId - ID of the job to delete.
 * @param {string} userId - ID of the user (for authorization).
 * @throws {Error} If job not found or user not authorized.
 */
const deleteScrapingJob = async (jobId, userId) => {
  const job = await ScrapingJob.findOne({
    where: { id: jobId, userId },
  });

  if (!job) {
    throw new Error('Scraping job not found or unauthorized');
  }

  await job.destroy();
  schedulerService.removeJobFromScheduler(jobId); // Remove from scheduler
  logger.info(`Scraping job deleted: ${job.id}`);
};

/**
 * Executes a single scraping job manually.
 * @param {string} jobId - ID of the job to execute.
 * @param {string} userId - ID of the user (for authorization).
 * @returns {Promise<Object>} The created scraping result.
 * @throws {Error} If job not found or scraping fails.
 */
const executeScrapingJob = async (jobId, userId) => {
  const job = await ScrapingJob.findOne({ where: { id: jobId, userId } });

  if (!job) {
    throw new Error('Scraping job not found or unauthorized');
  }

  // Update job status to RUNNING
  job.status = 'RUNNING';
  job.lastRunAt = new Date();
  job.runCount = job.runCount + 1;
  await job.save();

  let resultData;
  let resultStatus = 'SUCCESS';
  let errorMessage = null;

  try {
    resultData = await scrapePage(job.startUrl, job.cssSelectors, job.jsRendering);
    job.status = 'COMPLETED';
    logger.info(`Scraping job ${job.id} completed successfully.`);
  } catch (error) {
    resultStatus = 'FAILED';
    errorMessage = error.message;
    job.status = 'FAILED';
    logger.error(`Scraping job ${job.id} failed: ${error.message}`);
  } finally {
    await job.save(); // Save final status

    // Create a new scraping result record
    const scrapingResult = await ScrapingResult.create({
      jobId: job.id,
      url: job.startUrl,
      data: resultData || {},
      status: resultStatus,
      errorMessage: errorMessage,
    });
    return scrapingResult;
  }
};

/**
 * Fetches results for a specific scraping job.
 * @param {string} jobId - The ID of the scraping job.
 * @param {string} userId - The ID of the user (for authorization).
 * @returns {Promise<Array<Object>>} List of results for the job.
 * @throws {Error} If job not found or user not authorized.
 */
const getScrapingJobResults = async (jobId, userId) => {
  const job = await ScrapingJob.findOne({ where: { id: jobId, userId } });
  if (!job) {
    throw new Error('Scraping job not found or unauthorized');
  }

  const results = await ScrapingResult.findAll({
    where: { jobId },
    order: [['scrapedAt', 'DESC']],
  });
  return results;
};

module.exports = {
  createScrapingJob,
  getScrapingJobs,
  getScrapingJobById,
  updateScrapingJob,
  deleteScrapingJob,
  executeScrapingJob,
  getScrapingJobResults,
};
```