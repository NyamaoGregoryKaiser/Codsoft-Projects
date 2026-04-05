const { Queue, QueueScheduler } = require('bullmq');
const { redis: redisConfig } = require('../config');
const logger = require('../utils/logger');
const { ScrapeJob } = require('../db/models'); // To update job status
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');

const REDIS_CONNECTION = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

const SCRAPE_QUEUE_NAME = 'scrapeQueue';
const SCRAPE_JOB_OPTIONS = {
  attempts: 3, // Retry failed jobs up to 3 times
  backoff: {
    type: 'exponential',
    delay: 5000, // First retry after 5 seconds, then 10s, 20s...
  },
};

const queue = new Queue(SCRAPE_QUEUE_NAME, {
  connection: REDIS_CONNECTION,
  defaultJobOptions: SCRAPE_JOB_OPTIONS,
});

// A scheduler is required for repeatable jobs (cron jobs)
const queueScheduler = new QueueScheduler(SCRAPE_QUEUE_NAME, {
  connection: REDIS_CONNECTION,
});

/**
 * Add a scraping job to the queue immediately.
 * @param {string} targetId
 * @param {string} userId
 * @returns {Promise<Object>} BullMQ job object
 */
const addImmediateScrapeJob = async (targetId, userId) => {
  const job = await queue.add(
    'scrapeTarget',
    { targetId, userId },
    {
      jobId: `immediate-scrape-${targetId}-${Date.now()}`,
      removeOnComplete: true, // Remove job from queue once completed
      removeOnFail: 1000, // Keep failed jobs for 1000 seconds
    }
  );
  logger.info(`Immediate scrape job added for target ${targetId}. Job ID: ${job.id}`);
  return job;
};

/**
 * Schedule a repeatable scraping job.
 * @param {Object} target - The target object with ID and schedule (cron string)
 * @returns {Promise<Object>} BullMQ job object
 */
const scheduleJob = async (target) => {
  if (!target.schedule) {
    logger.warn(`Target ${target.id} has no schedule defined. Skipping.`);
    return null;
  }

  const job = await queue.add(
    'scrapeTarget',
    { targetId: target.id, userId: target.userId },
    {
      jobId: `scheduled-scrape-${target.id}`, // Unique ID for repeatable jobs
      repeat: { cron: target.schedule },
      removeOnComplete: true,
      removeOnFail: 1000,
    }
  );
  logger.info(`Scheduled job for target ${target.id} with cron: ${target.schedule}. Job ID: ${job.id}`);
  return job;
};

/**
 * Remove a scheduled job.
 * @param {string} targetId
 * @returns {Promise<void>}
 */
const removeJob = async (targetId) => {
  const jobId = `scheduled-scrape-${targetId}`;
  const repeatableJobs = await queue.getRepeatableJobs();
  const jobToRemove = repeatableJobs.find(job => job.id === jobId);

  if (jobToRemove) {
    await queue.removeRepeatableByKey(jobToRemove.key);
    logger.info(`Removed scheduled job for target ${targetId}. Job Key: ${jobToRemove.key}`);
  } else {
    logger.info(`No scheduled job found for target ${targetId} to remove.`);
  }
};

/**
 * Update the status of a ScrapeJob in the database.
 * @param {string} jobId
 * @param {string} status - 'pending', 'in_progress', 'completed', 'failed'
 * @param {Object} [result] - Optional, the result data or error message
 */
const updateScrapeJobStatus = async (jobId, status, result = null) => {
  try {
    const scrapeJob = await ScrapeJob.findByPk(jobId);
    if (!scrapeJob) {
      logger.error(`ScrapeJob with ID ${jobId} not found for status update.`);
      return;
    }
    const updatePayload = { status };
    if (result) {
      if (status === 'completed') {
        updatePayload.result = result; // Store data or summary
      } else if (status === 'failed') {
        updatePayload.error = result;
      }
    }
    await scrapeJob.update(updatePayload);
    logger.debug(`ScrapeJob ${jobId} status updated to: ${status}`);
  } catch (error) {
    logger.error(`Error updating ScrapeJob ${jobId} status to ${status}:`, error.message);
  }
};

module.exports = {
  queue,
  queueScheduler,
  addImmediateScrapeJob,
  scheduleJob,
  removeJob,
  updateScrapeJobStatus,
};