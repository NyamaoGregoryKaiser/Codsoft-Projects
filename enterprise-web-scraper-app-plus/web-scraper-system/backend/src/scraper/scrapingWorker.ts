```typescript
import cron from 'node-cron';
import { ScrapingJob, ScrapingJobStatus } from '@prisma/client';
import { logger } from '../middleware/logger';
import prisma from '../database/prisma';
import scraperService from './scraperService';

interface ScheduledJob {
  job: ScrapingJob;
  cronTask: cron.ScheduledTask;
}

class ScrapingWorker {
  private scheduledJobs: Map<string, ScheduledJob> = new Map(); // jobId -> ScheduledJob

  constructor() {
    this.initializeScheduler();
  }

  private async initializeScheduler() {
    // On startup, load all active jobs from DB and schedule them
    logger.info('Initializing scraping scheduler...');
    try {
      const activeJobs = await prisma.scrapingJob.findMany({
        where: { isActive: true, cronSchedule: { not: null, not: '' } },
      });

      activeJobs.forEach(job => {
        this.scheduleJob(job);
      });
      logger.info(`Scheduled ${activeJobs.length} active jobs on startup.`);
    } catch (error: any) {
      logger.error('Failed to initialize scheduler with active jobs:', error.message);
    }
  }

  private async executeJob(job: ScrapingJob) {
    logger.info(`Executing scheduled job: ${job.name} (ID: ${job.id})`);
    try {
      // Mark job as RUNNING
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: { status: ScrapingJobStatus.RUNNING },
      });

      await scraperService.scrape(job);

    } catch (error: any) {
      logger.error(`Error executing job ${job.name} (ID: ${job.id}):`, error);
      // In case of an unhandled error during scraperService.scrape, ensure status is reset
      await prisma.scrapingJob.update({
        where: { id: job.id },
        data: {
          status: job.isActive ? ScrapingJobStatus.ACTIVE : ScrapingJobStatus.INACTIVE,
          lastRunAt: new Date(), // Still counts as a run, even if failed outside try/catch in scraperService
        },
      });
    }
  }

  scheduleJob(job: ScrapingJob) {
    // If job is already scheduled, cancel it first to update
    if (this.scheduledJobs.has(job.id)) {
      this.cancelJob(job.id);
    }

    if (!job.isActive || !job.cronSchedule) {
      logger.info(`Job ${job.name} is inactive or has no schedule. Not scheduling.`);
      return;
    }

    if (!cron.validate(job.cronSchedule)) {
      logger.error(`Invalid cron schedule for job ${job.name} (ID: ${job.id}): ${job.cronSchedule}`);
      return;
    }

    logger.info(`Scheduling job: "${job.name}" with cron: "${job.cronSchedule}"`);
    const cronTask = cron.schedule(job.cronSchedule, async () => {
      await this.executeJob(job);
    }, {
      scheduled: true,
      timezone: 'Etc/UTC', // Use a consistent timezone for scheduling
    });

    this.scheduledJobs.set(job.id, { job, cronTask });

    // Update nextRunAt in DB
    const nextRun = cronTask.nextDates(1); // Get the next scheduled run time
    if (nextRun && nextRun.length > 0) {
      prisma.scrapingJob.update({
        where: { id: job.id },
        data: { nextRunAt: nextRun[0].toDate() },
      }).catch(err => logger.error(`Failed to update nextRunAt for job ${job.id}: ${err.message}`));
    }
  }

  cancelJob(jobId: string) {
    const scheduled = this.scheduledJobs.get(jobId);
    if (scheduled) {
      scheduled.cronTask.stop();
      this.scheduledJobs.delete(jobId);
      logger.info(`Cancelled scheduled job: ${scheduled.job.name} (ID: ${jobId})`);
      // Clear nextRunAt in DB
      prisma.scrapingJob.update({
        where: { id: jobId },
        data: { nextRunAt: null },
      }).catch(err => logger.error(`Failed to clear nextRunAt for job ${jobId}: ${err.message}`));
    }
  }

  runJobNow(job: ScrapingJob) {
    // Run immediately, outside of cron schedule
    logger.info(`Manually triggering job: ${job.name} (ID: ${job.id})`);
    this.executeJob(job);
  }

  // Gracefully shut down all cron jobs
  async stopAllJobs() {
    logger.info('Stopping all scheduled scraping jobs...');
    for (const [jobId, { cronTask }] of this.scheduledJobs) {
      cronTask.stop();
      // Optionally update job status in DB if desired, e.g., to INACTIVE
      await prisma.scrapingJob.update({
        where: { id: jobId },
        data: { status: ScrapingJobStatus.INACTIVE, nextRunAt: null },
      }).catch(err => logger.error(`Failed to update status for job ${jobId} on shutdown: ${err.message}`));
    }
    this.scheduledJobs.clear();
    await scraperService.closeBrowser(); // Close the Puppeteer browser
    logger.info('All scheduled jobs stopped and browser closed.');
  }
}

const scrapingWorker = new ScrapingWorker();

// Export for usage and for testing purposes if needed
export default scrapingWorker;
```