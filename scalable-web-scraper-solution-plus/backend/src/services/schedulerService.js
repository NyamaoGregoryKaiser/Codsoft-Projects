```javascript
const cron = require('node-cron');
const { ScrapingJob } = require('../models');
const { executeScrapingJob } = require('./scrapingJobService');
const logger = require('../utils/logger');

// Store cron jobs instances
const scheduledJobs = new Map();

/**
 * Initializes the scheduler by loading existing jobs from the database.
 * This should be called once on application startup.
 */
const initScheduler = async () => {
  logger.info('Initializing scraping job scheduler...');
  try {
    const jobs = await ScrapingJob.findAll({
      where: {
        schedule: {
          [require('sequelize').Op.ne]: null // schedule is not null
        }
      }
    });

    jobs.forEach(job => {
      addJobToScheduler(job);
    });
    logger.info(`Loaded ${jobs.length} scheduled jobs into scheduler.`);
  } catch (error) {
    logger.error(`Error initializing scheduler: ${error.message}`, error);
  }
};

/**
 * Adds a scraping job to the scheduler.
 * @param {Object} job - The ScrapingJob instance.
 */
const addJobToScheduler = (job) => {
  if (!job.schedule) {
    logger.warn(`Job ${job.id} has no schedule defined, skipping addition to scheduler.`);
    return;
  }

  // Remove existing job if it's already scheduled
  if (scheduledJobs.has(job.id)) {
    removeJobFromScheduler(job.id);
  }

  const task = cron.schedule(job.schedule, async () => {
    logger.info(`Running scheduled job: ${job.name} (ID: ${job.id})`);
    try {
      // Execute the job, passing the userId for authorization context within executeScrapingJob
      await executeScrapingJob(job.id, job.userId);
    } catch (error) {
      logger.error(`Failed to run scheduled job ${job.id}: ${error.message}`, error);
      // Optionally update job status to FAILED in DB
      await job.update({ status: 'FAILED', lastRunAt: new Date() });
    } finally {
      // Update next run time for consistency
      const nextRunDate = task.nextDates(1); // Get the next scheduled run date
      await job.update({ nextRunAt: nextRunDate[0] });
    }
  }, {
    scheduled: true, // Start immediately
    timezone: "Etc/UTC" // Use UTC for cron scheduling
  });

  scheduledJobs.set(job.id, task);
  const nextRunDate = task.nextDates(1);
  job.update({ nextRunAt: nextRunDate[0] }) // Update job in DB with next run time
    .catch(err => logger.error(`Error updating nextRunAt for job ${job.id}: ${err.message}`));

  logger.info(`Job ${job.name} (ID: ${job.id}) scheduled with cron: ${job.schedule}. Next run at: ${nextRunDate[0]}`);
};

/**
 * Removes a scraping job from the scheduler.
 * @param {string} jobId - The ID of the scraping job.
 */
const removeJobFromScheduler = (jobId) => {
  const jobTask = scheduledJobs.get(jobId);
  if (jobTask) {
    jobTask.stop();
    scheduledJobs.delete(jobId);
    logger.info(`Job ${jobId} removed from scheduler.`);
  }
};

/**
 * Gets the next scheduled run date for a job.
 * @param {string} cronExpression - The cron expression.
 * @returns {Date | null} The next scheduled date, or null if invalid expression.
 */
const getNextRunDate = (cronExpression) => {
  try {
    const nextDate = cron.getTasks(cronExpression, { timezone: 'Etc/UTC' }).nextDates(1);
    return nextDate[0] || null;
  } catch (error) {
    logger.warn(`Invalid cron expression: ${cronExpression}. Error: ${error.message}`);
    return null;
  }
};

module.exports = {
  initScheduler,
  addJobToScheduler,
  removeJobFromScheduler,
  getNextRunDate,
};
```