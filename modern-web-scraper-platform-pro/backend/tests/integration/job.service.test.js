```javascript
// backend/tests/integration/job.service.test.js
const db = require('../../src/models');
const jobService = require('../../src/services/job.service');
const scraperService = require('../../src/services/scraper.service');
const logger = require('../../src/services/logger.service');
const cron = require('node-cron');

// Mock scraperService to prevent actual scraping in integration tests
jest.mock('../../src/services/scraper.service', () => ({
  scrapeWebsite: jest.fn(() => Promise.resolve({
    title: 'Mock Scraped Title',
    url: 'http://mock.example.com/article/1',
  })),
}));

// Mock logger to avoid console spam during tests
jest.mock('../../src/services/logger.service', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

// Mock node-cron to control scheduling in tests
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({
    stop: jest.fn(),
  })),
  getTasks: jest.fn(() => new Map()), // Return an empty map by default
  validate: jest.fn(() => true), // Assume cron expressions are always valid for testing
}));

describe('JobService Integration Tests', () => {
  let adminUser, testWebsite, testJob;

  beforeAll(async () => {
    // Ensure database is clean and re-synced for tests
    await db.sequelize.sync({ force: true });
    // Create necessary seed data for tests
    adminUser = await db.User.create({
      email: 'admin_jobtest@example.com',
      password: 'password123',
      role: 'admin',
    });
    testWebsite = await db.Website.create({
      name: 'Test Website for Jobs',
      url: 'http://test-job.example.com',
      description: 'Website for job service tests',
    });
  });

  afterEach(async () => {
    // Clean up job-related data after each test
    await db.JobLog.destroy({ where: {} });
    await db.ScrapedData.destroy({ where: {} });
    await db.ScrapingJob.destroy({ where: {} });
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Clean up all test data
    await db.Website.destroy({ where: { id: testWebsite.id } });
    await db.User.destroy({ where: { id: adminUser.id } });
    await db.sequelize.close();
  });

  describe('createJob', () => {
    it('should create a new scraping job and schedule it if cronSchedule is provided', async () => {
      const jobData = {
        name: 'New Scheduled Job',
        websiteId: testWebsite.id,
        cronSchedule: '*/5 * * * *', // Every 5 minutes
        selectorConfig: { fields: { title: 'h1' } },
        userId: adminUser.id,
      };

      const job = await jobService.createJob(jobData);

      expect(job).toBeDefined();
      expect(job.name).toBe(jobData.name);
      expect(job.cronSchedule).toBe(jobData.cronSchedule);
      expect(cron.schedule).toHaveBeenCalledTimes(1); // Should be scheduled
      expect(job.status).toBe('pending');
      testJob = job; // Store for other tests
    });

    it('should create a new scraping job without scheduling if no cronSchedule', async () => {
      const jobData = {
        name: 'New Manual Job',
        websiteId: testWebsite.id,
        selectorConfig: { fields: { title: 'h1' } },
        userId: adminUser.id,
      };

      const job = await jobService.createJob(jobData);

      expect(job).toBeDefined();
      expect(job.name).toBe(jobData.name);
      expect(job.cronSchedule).toBeNull();
      expect(cron.schedule).not.toHaveBeenCalled(); // Should not be scheduled
      expect(job.status).toBe('pending');
    });

    it('should throw an error if websiteId is invalid', async () => {
      const jobData = {
        name: 'Invalid Website Job',
        websiteId: 9999, // Non-existent ID
        selectorConfig: { fields: { title: 'h1' } },
        userId: adminUser.id,
      };

      await expect(jobService.createJob(jobData)).rejects.toThrow('Website not found');
    });
  });

  describe('executeJob', () => {
    beforeEach(async () => {
      // Create a job for execution tests
      testJob = await db.ScrapingJob.create({
        name: 'Executable Test Job',
        websiteId: testWebsite.id,
        selectorConfig: { fields: { title: '.test-title' } },
        userId: adminUser.id,
        status: 'pending',
      });
    });

    it('should execute a job, save scraped data, and update job status', async () => {
      await jobService.executeJob(testJob.id);

      const updatedJob = await db.ScrapingJob.findByPk(testJob.id);
      expect(updatedJob.status).toBe('completed');
      expect(updatedJob.lastRun).toBeDefined();

      const scrapedData = await db.ScrapedData.findOne({ where: { jobId: testJob.id } });
      expect(scrapedData).toBeDefined();
      expect(scrapedData.data.title).toBe('Mock Scraped Title');
      expect(scraperService.scrapeWebsite).toHaveBeenCalledTimes(1);

      const jobLogs = await db.JobLog.findAll({ where: { jobId: testJob.id } });
      expect(jobLogs.length).toBeGreaterThanOrEqual(2); // Start and Complete
      expect(jobLogs.some(log => log.message.includes('Job execution started'))).toBe(true);
      expect(jobLogs.some(log => log.message.includes('Job execution completed'))).toBe(true);
    });

    it('should log an error and update job status to failed if scraping fails', async () => {
      scraperService.scrapeWebsite.mockImplementationOnce(() =>
        Promise.reject(new Error('Scraping failed for some reason'))
      );

      await jobService.executeJob(testJob.id);

      const updatedJob = await db.ScrapingJob.findByPk(testJob.id);
      expect(updatedJob.status).toBe('failed');
      expect(updatedJob.lastRun).toBeDefined();

      const jobLogs = await db.JobLog.findAll({ where: { jobId: testJob.id } });
      expect(jobLogs.some(log => log.level === 'error' && log.message.includes('Scraping failed'))).toBe(true);
    });
  });

  // More tests for updateJob, deleteJob, getJobById, getAllJobs, initializeScheduledJobs etc.
});
```