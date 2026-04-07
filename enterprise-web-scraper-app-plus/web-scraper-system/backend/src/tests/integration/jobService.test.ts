```typescript
import JobService from '../../services/jobService';
import prisma from '../../database/prisma';
import { ApiError } from '../../middleware/errorHandler';
import { UserRole } from '@prisma/client';
import scrapingWorker from '../../scraper/scrapingWorker';

// Mock scrapingWorker to prevent actual cron scheduling during tests
jest.mock('../../scraper/scrapingWorker', () => ({
  scheduleJob: jest.fn(),
  cancelJob: jest.fn(),
  runJobNow: jest.fn(),
}));

describe('JobService Integration Tests', () => {
  let userId: string;
  let adminId: string;
  let jobData: any;
  let adminJobData: any;

  beforeEach(async () => {
    // Create a regular user
    const user = await prisma.user.create({
      data: { email: 'user@test.com', password: 'hashedpassword', role: UserRole.USER },
    });
    userId = user.id;

    // Create an admin user
    const admin = await prisma.user.create({
      data: { email: 'admin@test.com', password: 'hashedpassword', role: UserRole.ADMIN },
    });
    adminId = admin.id;

    jobData = {
      userId,
      name: 'Test Job',
      url: 'https://example.com',
      cssSelectors: [{ name: 'title', selector: 'h1' }],
      cronSchedule: '0 * * * *',
      isActive: true,
    };

    adminJobData = {
      userId: adminId,
      name: 'Admin Test Job',
      url: 'https://admin-example.com',
      cssSelectors: [{ name: 'admin-title', selector: 'h2' }],
      cronSchedule: '0 * * * *',
      isActive: true,
    };

    jest.clearAllMocks(); // Clear mocks for scrapingWorker
  });

  describe('createJob', () => {
    it('should create a new scraping job', async () => {
      const job = await JobService.createJob(jobData);
      expect(job).toMatchObject({
        name: 'Test Job',
        url: 'https://example.com',
        userId,
        isActive: true,
      });
      expect(scrapingWorker.scheduleJob).toHaveBeenCalledTimes(1);
    });
  });

  describe('getJobs', () => {
    it('should return only user jobs for a regular user', async () => {
      await JobService.createJob(jobData);
      await JobService.createJob(adminJobData); // Admin's job

      const jobs = await JobService.getJobs(userId, UserRole.USER, 10, 0);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].userId).toBe(userId);
    });

    it('should return all jobs for an admin user', async () => {
      await JobService.createJob(jobData);
      await JobService.createJob(adminJobData);

      const jobs = await JobService.getJobs(adminId, UserRole.ADMIN, 10, 0);
      expect(jobs).toHaveLength(2);
      expect(jobs.some(j => j.userId === userId)).toBe(true);
      expect(jobs.some(j => j.userId === adminId)).toBe(true);
    });
  });

  describe('getJobById', () => {
    it('should return a job if user is owner', async () => {
      const createdJob = await JobService.createJob(jobData);
      const job = await JobService.getJobById(createdJob.id, userId, UserRole.USER);
      expect(job.id).toBe(createdJob.id);
    });

    it('should return a job if user is admin', async () => {
      const createdJob = await JobService.createJob(jobData);
      const job = await JobService.getJobById(createdJob.id, adminId, UserRole.ADMIN);
      expect(job.id).toBe(createdJob.id);
    });

    it('should throw ApiError if user is not owner and not admin', async () => {
      const createdJob = await JobService.createJob(adminJobData);
      await expect(JobService.getJobById(createdJob.id, userId, UserRole.USER))
        .rejects.toThrow(ApiError);
    });
  });

  describe('updateJob', () => {
    it('should update a job and reschedule if cron changes', async () => {
      const createdJob = await JobService.createJob(jobData);
      const updatedJob = await JobService.updateJob(
        createdJob.id,
        userId,
        UserRole.USER,
        { name: 'Updated Job', cronSchedule: '0 0 * * *' }
      );
      expect(updatedJob.name).toBe('Updated Job');
      expect(updatedJob.cronSchedule).toBe('0 0 * * *');
      expect(scrapingWorker.cancelJob).toHaveBeenCalledWith(createdJob.id);
      expect(scrapingWorker.scheduleJob).toHaveBeenCalledTimes(2); // Initial create + update
    });

    it('should cancel job scheduling if isActive becomes false', async () => {
      const createdJob = await JobService.createJob(jobData);
      const updatedJob = await JobService.updateJob(
        createdJob.id,
        userId,
        UserRole.USER,
        { isActive: false }
      );
      expect(updatedJob.isActive).toBe(false);
      expect(scrapingWorker.cancelJob).toHaveBeenCalledWith(createdJob.id);
    });
  });

  describe('deleteJob', () => {
    it('should delete a job and cancel its schedule', async () => {
      const createdJob = await JobService.createJob(jobData);
      await JobService.deleteJob(createdJob.id, userId, UserRole.USER);
      const jobInDb = await prisma.scrapingJob.findUnique({ where: { id: createdJob.id } });
      expect(jobInDb).toBeNull();
      expect(scrapingWorker.cancelJob).toHaveBeenCalledWith(createdJob.id);
    });
  });

  describe('triggerJob', () => {
    it('should trigger a job manually', async () => {
      const createdJob = await JobService.createJob(jobData);
      await JobService.triggerJob(createdJob.id, userId, UserRole.USER);
      expect(scrapingWorker.runJobNow).toHaveBeenCalledWith(expect.objectContaining({ id: createdJob.id }));
    });
  });

  describe('getJobResults', () => {
    it('should return results for an owned job', async () => {
      const createdJob = await JobService.createJob(jobData);
      await prisma.scrapingResult.createMany({
        data: [
          { jobId: createdJob.id, status: 'SUCCESS', data: { key: 'value1' } },
          { jobId: createdJob.id, status: 'FAILED', error: 'error' },
        ],
      });
      const results = await JobService.getJobResults(createdJob.id, userId, UserRole.USER, 10, 0);
      expect(results).toHaveLength(2);
    });
  });

  describe('getResultById', () => {
    it('should return a result if user owns the associated job', async () => {
      const createdJob = await JobService.createJob(jobData);
      const createdResult = await prisma.scrapingResult.create({
        data: { jobId: createdJob.id, status: 'SUCCESS', data: { key: 'value' } },
      });
      const result = await JobService.getResultById(createdResult.id, userId, UserRole.USER);
      expect(result.id).toBe(createdResult.id);
    });

    it('should throw ApiError if user does not own the associated job', async () => {
      const createdJob = await JobService.createJob(adminJobData);
      const createdResult = await prisma.scrapingResult.create({
        data: { jobId: createdJob.id, status: 'SUCCESS', data: { key: 'value' } },
      });
      await expect(JobService.getResultById(createdResult.id, userId, UserRole.USER))
        .rejects.toThrow(ApiError);
    });
  });
});
```