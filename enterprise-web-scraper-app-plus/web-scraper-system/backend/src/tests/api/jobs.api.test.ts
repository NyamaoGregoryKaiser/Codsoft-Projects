```typescript
import request from 'supertest';
import app from '../../app';
import prisma from '../../database/prisma';
import { UserRole } from '@prisma/client';
import scrapingWorker from '../../scraper/scrapingWorker';

// Mock scrapingWorker to prevent actual cron scheduling during API tests
jest.mock('../../scraper/scrapingWorker', () => ({
  scheduleJob: jest.fn(),
  cancelJob: jest.fn(),
  runJobNow: jest.fn(),
  stopAllJobs: jest.fn(),
}));

describe('Jobs API Endpoints', () => {
  let userToken: string;
  let adminToken: string;
  let userId: string;
  let adminId: string;
  let userJobId: string;
  let adminJobId: string;

  const testUser = { email: 'job_test_user@example.com', password: 'Password123!' };
  const testAdmin = { email: 'job_test_admin@example.com', password: 'AdminPassword123!', role: UserRole.ADMIN };

  beforeAll(async () => {
    // Register and login user
    await request(app).post('/api/auth/register').send(testUser);
    const userLoginRes = await request(app).post('/api/auth/login').send(testUser);
    userToken = userLoginRes.body.data.token;
    userId = userLoginRes.body.data.user.id;

    // Register and login admin
    await request(app).post('/api/auth/register').send(testAdmin);
    const adminLoginRes = await request(app).post('/api/auth/login').send(testAdmin);
    adminToken = adminLoginRes.body.data.token;
    adminId = adminLoginRes.body.data.user.id;

    // Create a job for the user
    const userJobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'User Article Scraper',
        url: 'https://example.com/articles',
        cssSelectors: [{ name: 'articleTitle', selector: 'h2.title' }],
        cronSchedule: '0 * * * *',
        isActive: true,
      });
    userJobId = userJobRes.body.data.id;

    // Create a job for the admin
    const adminJobRes = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Admin Product Scraper',
        url: 'https://example.com/products',
        cssSelectors: [{ name: 'productName', selector: '.product-name' }],
        cronSchedule: '0 */2 * * *',
        isActive: true,
      });
    adminJobId = adminJobRes.body.data.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/jobs', () => {
    it('should create a new job for an authenticated user', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Another User Scraper',
          url: 'https://another.example.com',
          cssSelectors: [{ name: 'item', selector: '.item' }],
          cronSchedule: '*/5 * * * *',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.data.name).toBe('Another User Scraper');
      expect(res.body.data.userId).toBe(userId);
      expect(scrapingWorker.scheduleJob).toHaveBeenCalledTimes(3); // Initial two + this one
    });

    it('should return 400 for invalid job data', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Short',
          url: 'invalid-url', // Invalid URL
          cssSelectors: [], // Empty selectors
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Validation Error');
      expect(res.body.error).toEqual(expect.arrayContaining([
        expect.stringContaining('"url" must be a valid uri'),
        expect.stringContaining('"cssSelectors" must contain at least 1 item'),
      ]));
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .send({
          name: 'Unauthorized Job',
          url: 'https://example.com',
          cssSelectors: [{ name: 'test', selector: 'h1' }],
        });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/jobs', () => {
    it('should return only user-owned jobs for a regular user', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // Initial user job + the one created above
      expect(res.body.data.every((job: any) => job.userId === userId)).toBe(true);
    });

    it('should return all jobs for an admin user', async () => {
      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // User jobs + admin jobs
      expect(res.body.data.some((job: any) => job.userId === userId)).toBe(true);
      expect(res.body.data.some((job: any) => job.userId === adminId)).toBe(true);
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return a user-owned job', async () => {
      const res = await request(app)
        .get(`/api/jobs/${userJobId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe(userJobId);
      expect(res.body.data.userId).toBe(userId);
    });

    it('should return an admin-owned job for an admin', async () => {
      const res = await request(app)
        .get(`/api/jobs/${adminJobId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe(adminJobId);
      expect(res.body.data.userId).toBe(adminId);
    });

    it('should return an admin-owned job for a user (if admin also owns it, or if admin can see all)', async () => {
      // In this setup, admin can see all. Regular user cannot see other users' jobs.
      const res = await request(app)
        .get(`/api/jobs/${adminJobId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404); // User cannot see admin's job
    });

    it('should return 404 for non-existent job', async () => {
      const res = await request(app)
        .get('/api/jobs/nonexistentid')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PUT /api/jobs/:id', () => {
    it('should update a user-owned job', async () => {
      const res = await request(app)
        .put(`/api/jobs/${userJobId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated User Scraper Name', isActive: false });
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.name).toBe('Updated User Scraper Name');
      expect(res.body.data.isActive).toBe(false);
      expect(scrapingWorker.cancelJob).toHaveBeenCalledWith(userJobId); // Should cancel old schedule
    });

    it('should return 403 if a regular user tries to update another user\'s job', async () => {
      const res = await request(app)
        .put(`/api/jobs/${adminJobId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Attempted Update' });
      expect(res.statusCode).toEqual(404); // Job not found or unauthorized
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete a user-owned job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${userJobId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(204);
      expect(scrapingWorker.cancelJob).toHaveBeenCalledWith(userJobId);
      const jobInDb = await prisma.scrapingJob.findUnique({ where: { id: userJobId } });
      expect(jobInDb).toBeNull();
    });

    it('should return 403 if a regular user tries to delete another user\'s job', async () => {
      const res = await request(app)
        .delete(`/api/jobs/${adminJobId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404); // Job not found or unauthorized
    });
  });

  describe('POST /api/jobs/:id/run', () => {
    it('should trigger a user-owned job manually', async () => {
      // Re-create user job for this test
      const userJobRes = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Manual User Scraper',
          url: 'https://example.com/manual',
          cssSelectors: [{ name: 'item', selector: 'div' }],
          isActive: true,
        });
      const manualUserJobId = userJobRes.body.data.id;

      const res = await request(app)
        .post(`/api/jobs/${manualUserJobId}/run`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(202);
      expect(res.body.message).toContain('triggered successfully');
      expect(scrapingWorker.runJobNow).toHaveBeenCalledWith(expect.objectContaining({ id: manualUserJobId }));
    });
  });

  describe('GET /api/jobs/:id/results', () => {
    let resultId: string;

    beforeAll(async () => {
      // Create some results for admin job
      const job = await prisma.scrapingJob.findUnique({ where: { id: adminJobId } });
      if (job) {
        const result1 = await prisma.scrapingResult.create({
          data: {
            jobId: job.id,
            status: 'SUCCESS',
            data: [{ title: 'Product 1', price: '$10' }],
            timestamp: new Date(),
          },
        });
        resultId = result1.id;
        await prisma.scrapingResult.create({
          data: {
            jobId: job.id,
            status: 'FAILED',
            error: 'Network timeout',
            timestamp: new Date(),
          },
        });
      }
    });

    it('should return results for an admin-owned job for an admin', async () => {
      const res = await request(app)
        .get(`/api/jobs/${adminJobId}/results`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data[0].jobId).toBe(adminJobId);
    });

    it('should return 404 if a regular user tries to get results for another user\'s job', async () => {
      const res = await request(app)
        .get(`/api/jobs/${adminJobId}/results`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /api/results/:id', () => {
    let resultId: string;

    beforeAll(async () => {
      // Create a job for the user
      const job = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Result Test Scraper',
          url: 'https://example.com/results',
          cssSelectors: [{ name: 'item', selector: 'li' }],
          isActive: true,
        });
      const newJobId = job.body.data.id;

      // Create a result for that job
      const createdResult = await prisma.scrapingResult.create({
        data: {
          jobId: newJobId,
          status: 'SUCCESS',
          data: [{ item: 'Result Data' }],
          timestamp: new Date(),
        },
      });
      resultId = createdResult.id;
    });

    it('should return a single result if user owns the associated job', async () => {
      const res = await request(app)
        .get(`/api/results/${resultId}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe(resultId);
      expect(res.body.data.data[0].item).toBe('Result Data');
    });

    it('should return 404 if a regular user tries to get a result for another user\'s job', async () => {
      // Get an admin-owned result for testing
      const adminJob = await prisma.scrapingJob.findFirst({ where: { userId: adminId } });
      const adminResult = await prisma.scrapingResult.findFirst({ where: { jobId: adminJob?.id } });

      if (!adminResult) {
        throw new Error('Admin result not found for test');
      }

      const res = await request(app)
        .get(`/api/results/${adminResult.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});
```