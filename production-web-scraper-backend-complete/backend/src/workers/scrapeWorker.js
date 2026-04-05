const { Worker } = require('bullmq');
const { redis: redisConfig } = require('../config');
const logger = require('../utils/logger');
const scrapingService = require('../services/scraping.service');
const { getTargetById } = require('../services/target.service');
const { updateScrapeJobStatus } = require('../services/jobScheduler.service');
const { ScrapedData, ScrapeJob } = require('../db/models');

const REDIS_CONNECTION = {
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
};

const SCRAPE_QUEUE_NAME = 'scrapeQueue';

let worker;

const setupWorker = () => {
  worker = new Worker(
    SCRAPE_QUEUE_NAME,
    async (job) => {
      const { targetId, userId } = job.data;
      const scrapeJobId = job.id.startsWith('scheduled-scrape-') ? job.id : job.id.startsWith('immediate-scrape-') ? job.id : null;

      logger.info(`Processing scrape job ${job.id} for target ${targetId}`);

      let dbScrapeJob;
      try {
        // Find or create a ScrapeJob entry in the DB for this run
        // For scheduled jobs, we might update an existing placeholder or create a new one each run
        // For immediate jobs, we create one.
        dbScrapeJob = await ScrapeJob.create({
          id: scrapeJobId || `run-${targetId}-${Date.now()}`, // Ensure unique ID for this execution
          targetId: targetId,
          userId: userId,
          status: 'in_progress',
          triggeredBy: userId,
          scheduledJobId: scrapeJobId ? null : job.id // Link to BullMQ job ID if not a direct scheduled job name
        });
        await updateScrapeJobStatus(dbScrapeJob.id, 'in_progress');

        const target = await getTargetById(targetId);
        if (!target) {
          throw new Error(`Target with ID ${targetId} not found.`);
        }

        const scrapedContent = await scrapingService.scrapeUrl(target.url, target.selectors);

        await ScrapedData.create({
          scrapeJobId: dbScrapeJob.id,
          targetId: targetId,
          data: scrapedContent,
        });

        await updateScrapeJobStatus(dbScrapeJob.id, 'completed', { message: 'Scraping successful', dataKeys: Object.keys(scrapedContent) });
        logger.info(`Scrape job ${job.id} for target ${targetId} completed successfully.`);
        return scrapedContent;
      } catch (error) {
        logger.error(`Scrape job ${job.id} for target ${targetId} failed:`, error.message);
        if (dbScrapeJob) {
          await updateScrapeJobStatus(dbScrapeJob.id, 'failed', { message: error.message, stack: error.stack });
        } else {
          logger.error(`Could not update status for job ${job.id} as DB entry was not created.`);
        }
        throw error; // Re-throw to allow BullMQ to handle retries
      }
    },
    {
      connection: REDIS_CONNECTION,
      concurrency: 5, // Process 5 jobs at a time
    }
  );

  worker.on('completed', (job) => {
    logger.debug(`Job ${job.id} has completed.`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} has failed with error: ${err.message}`);
  });

  worker.on('error', (err) => {
    logger.error('Worker error:', err);
  });
};

const getWorker = () => worker;

module.exports = {
  setupWorker,
  getWorker,
};