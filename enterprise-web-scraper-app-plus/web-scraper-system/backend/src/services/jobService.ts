```typescript
import { ScrapingJob, ScrapingResult, ScrapingJobStatus, UserRole } from '@prisma/client';
import prisma from '../database/prisma';
import { ApiError } from '../middleware/errorHandler';
import { Selector } from '../models/prisma'; // Import the Selector type
import scrapingWorker from '../scraper/scrapingWorker';

interface CreateJobData {
  userId: string;
  name: string;
  url: string;
  cssSelectors: Selector[];
  cronSchedule?: string | null;
  isActive?: boolean;
}

interface UpdateJobData {
  name?: string;
  url?: string;
  cssSelectors?: Selector[];
  cronSchedule?: string | null;
  isActive?: boolean;
}

class JobService {
  async createJob(data: CreateJobData): Promise<ScrapingJob> {
    const job = await prisma.scrapingJob.create({ data });
    if (job.isActive && job.cronSchedule) {
      scrapingWorker.scheduleJob(job);
    }
    return job;
  }

  async getJobs(userId: string, role: UserRole, limit: number, offset: number): Promise<ScrapingJob[]> {
    const whereClause = role === UserRole.ADMIN ? {} : { userId };
    return prisma.scrapingJob.findMany({
      where: whereClause,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJobById(jobId: string, userId: string, role: UserRole): Promise<ScrapingJob> {
    const job = await prisma.scrapingJob.findUnique({ where: { id: jobId } });

    if (!job || (job.userId !== userId && role !== UserRole.ADMIN)) {
      throw new ApiError(404, 'Scraping job not found or unauthorized');
    }
    return job;
  }

  async updateJob(jobId: string, userId: string, role: UserRole, data: UpdateJobData): Promise<ScrapingJob> {
    const existingJob = await this.getJobById(jobId, userId, role); // Checks ownership

    const updatedJob = await prisma.scrapingJob.update({
      where: { id: jobId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    // Re-schedule if cron or active status changed
    if (updatedJob.isActive && updatedJob.cronSchedule) {
      scrapingWorker.scheduleJob(updatedJob);
    } else {
      scrapingWorker.cancelJob(updatedJob.id);
    }

    return updatedJob;
  }

  async deleteJob(jobId: string, userId: string, role: UserRole): Promise<void> {
    // Ensure job exists and user has permission
    await this.getJobById(jobId, userId, role);

    await prisma.scrapingJob.delete({ where: { id: jobId } });
    scrapingWorker.cancelJob(jobId); // Also cancel any scheduled cron job
  }

  async triggerJob(jobId: string, userId: string, role: UserRole): Promise<string> {
    const job = await this.getJobById(jobId, userId, role); // Checks ownership
    scrapingWorker.runJobNow(job); // Trigger immediate run
    return `Scraping job '${job.name}' triggered successfully.`;
  }

  async getJobResults(jobId: string, userId: string, role: UserRole, limit: number, offset: number): Promise<ScrapingResult[]> {
    await this.getJobById(jobId, userId, role); // Checks ownership

    return prisma.scrapingResult.findMany({
      where: { jobId },
      take: limit,
      skip: offset,
      orderBy: { timestamp: 'desc' },
    });
  }

  async getResultById(resultId: string, userId: string, role: UserRole): Promise<ScrapingResult> {
    const result = await prisma.scrapingResult.findUnique({
      where: { id: resultId },
      include: { job: true },
    });

    if (!result || (result.job.userId !== userId && role !== UserRole.ADMIN)) {
      throw new ApiError(404, 'Scraping result not found or unauthorized');
    }
    return result;
  }
}

export default new JobService();
```