import cron from 'node-cron';
import { ScrapeJobRepository } from '../repositories/ScrapeJobRepository';
import { ScrapeJob } from '../entities/ScrapeJob';
import { executeScrapeJob } from './scraper';
import { logger } from './logger';
import { ScrapeJobStatus } from '../types/enums';

// Store cron tasks for management
const runningCronJobs = new Map<string, cron.ScheduledTask>();

const addOrUpdateJobToScheduler = async (job: ScrapeJob) => {
  // Remove existing job if it's being updated
  if (runningCronJobs.has(job.id)) {
    runningCronJobs.get(job.id)?.stop();
    runningCronJobs.delete(job.id);
    logger.info(`Stopped existing cron job for ScrapeJob ID: ${job.id}`);
  }

  if (job.status === ScrapeJobStatus.ACTIVE && job.schedule) {
    try {
      // Validate cron expression
      if (!cron.validate(job.schedule)) {
        logger.error(`Invalid cron schedule for job ${job.id}: ${job.schedule}. Skipping.`);
        // Update job status to failed or paused if schedule is invalid
        await ScrapeJobRepository.update(job.id, { status: ScrapeJobStatus.FAILED });
        return;
      }

      const task = cron.schedule(job.schedule, async () => {
        logger.info(`Executing scheduled job: ${job.id} (${job.url})`);
        try {
          await executeScrapeJob(job);
          await ScrapeJobRepository.update(job.id, {
            lastRun: new Date(),
            nextRun: calculateNextRun(job.schedule!),
          });
        } catch (error) {
          logger.error(`Error executing scheduled job ${job.id}:`, error);
          // Future: Implement retry logic or change status to FAILED after N retries
        }
      }, {
        scheduled: true,
        timezone: 'UTC', // Ensure consistent scheduling regardless of server location
      });
      runningCronJobs.set(job.id, task);
      logger.info(`Scheduled new cron job for ScrapeJob ID: ${job.id} with schedule: ${job.schedule}`);

      // Calculate and update next run time immediately for consistency
      await ScrapeJobRepository.update(job.id, {
        nextRun: calculateNextRun(job.schedule),
      });

    } catch (error) {
      logger.error(`Failed to schedule cron job for ${job.id}:`, error);
      await ScrapeJobRepository.update(job.id, { status: ScrapeJobStatus.FAILED });
    }
  } else {
    logger.info(`ScrapeJob ID: ${job.id} is not active or has no schedule. Not scheduling.`);
  }
};

const calculateNextRun = (cronSchedule: string): Date | undefined => {
  try {
    const nextDates = cron.get