```javascript
const request = require('supertest');
const app = require('../../src/app');
const { ScrapingJob, User } = require('../../src/models');
const { generateToken } = require('../../src/utils/helpers');
const nock = require('nock'); // For mocking external HTTP requests
const puppeteer = require('puppeteer'); // To mock puppeteer

// Mock Puppeteer for scrapingService.js
jest.mock('puppeteer', () => ({
  launch: jest.fn(() => ({
    newPage: jest.fn(() => ({
      goto: jest.fn(() => Promise.resolve()),
      evaluate: jest.fn(() => Promise.resolve({ mockedTitle: 'Mocked Puppeteer Title' })),
      close: jest.fn(() => Promise.resolve()),
    })),
    close: jest.fn(() => Promise.resolve()),
  })),
}));

describe('ScrapingJob API Integration Tests', () => {
  const adminUser = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    email: 'testadmin@example.com',
  };
  const regularUser = {
    id: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    email: 'testuser@example.com',
  };

  let adminToken;
  let userToken;
  let testJobId;

  beforeAll(async () => {
    adminToken = generateToken(adminUser.id);
    userToken = generateToken(regularUser.id);

    // Ensure users exist (from setup.js)
    await User.findByPk(adminUser.id);
    await User.findByPk(regularUser.id);

    // Mock external HTTP requests for cheerioScrape
    nock('http://example.com')
      .get('/static')
      .reply(200, '<html><body><h1 class="title">Static Page Title</h1></body></html>');
  });

  afterEach(async () => {
    // Clear the database tables after each test to ensure isolation
    await ScrapingJob.destroy({ truncate: true, cascade: true });
    jest.clearAllMocks(); // Clear puppeteer mocks
    if (!nock.isDone()) {
      nock.cleanAll();
    }
  });


  describe('POST /api/scraping-jobs', () => {
    it('should create a new scraping job for the authenticated user', async () => {
      const newJob = {
        name: 'My First Scrape',
        startUrl: 'http://example.com/static',
        cssSelectors: [{ name: 'title', selector: '.title' }],
        jsRendering: false, // Use Cheerio for this one
      };

      const res = await request(app)
        .post('/api/scraping-jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newJob);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual(newJob.name);
      expect(res.body.userId).toEqual(regularUser.id);
      expect(res.body.status).toEqual('PENDING');
      testJobId = res.body.id; // Save for later tests
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/scraping-jobs')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Incomplete Job',
          startUrl: 'http://example.com',
        }); // Missing cssSelectors

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toEqual('Please include name, startUrl, and at least one cssSelector');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/scraping-jobs')
        .send({
          name: 'Unauthorized Job',
          startUrl: 'http://example.com',
          cssSelectors: [{ name: 'test', selector: 'div' }],
        });

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/scraping-jobs', () => {
    beforeEach(async () => {
      // Create a job for the user before fetching
      const job = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Existing Job',
        startUrl: 'http://example.com',
        cssSelectors: [{ name: 'h1', selector: 'h1' }],
      });
      testJobId = job.id;
    });

    it('should return all scraping jobs for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/scraping-jobs')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].userId).toEqual(regularUser.id);
    });

    it('should not return jobs for other users', async () => {
      // Create a job for admin
      await ScrapingJob.create({
        userId: adminUser.id,
        name: 'Admin Job',
        startUrl: 'http://example.com',
        cssSelectors: [{ name: 'p', selector: 'p' }],
      });

      const res = await request(app)
        .get('/api/scraping-jobs')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toEqual(1); // Only the regular user's job
      expect(res.body[0].userId).toEqual(regularUser.id);
    });
  });

  describe('GET /api/scraping-jobs/:id', () => {
    let specificJob;
    beforeEach(async () => {
      specificJob = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Specific Job',
        startUrl: 'http://example.com/specific',
        cssSelectors: [{ name: 'div', selector: '#content' }],
      });
      testJobId = specificJob.id;
    });

    it('should return a specific scraping job by ID for the authorized user', async () => {
      const res = await request(app)
        .get(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(testJobId);
      expect(res.body.name).toEqual('Specific Job');
    });

    it('should return 404 if job ID does not exist', async () => {
      const nonExistentId = '11111111-1111-4111-1111-111111111111';
      const res = await request(app)
        .get(`/api/scraping-jobs/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Scraping job not found or unauthorized');
    });

    it('should return 404 if job belongs to another user', async () => {
      const res = await request(app)
        .get(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`); // Admin tries to access user's job

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Scraping job not found or unauthorized');
    });
  });

  describe('PUT /api/scraping-jobs/:id', () => {
    let jobToUpdate;
    beforeEach(async () => {
      jobToUpdate = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Job to Update',
        startUrl: 'http://example.com/old',
        cssSelectors: [{ name: 'p', selector: 'p' }],
      });
      testJobId = jobToUpdate.id;
    });

    it('should update an existing scraping job for the authorized user', async () => {
      const updates = {
        name: 'Updated Job Name',
        startUrl: 'http://example.com/new',
        schedule: '0 0 * * *', // Daily at midnight
        jsRendering: true,
      };

      const res = await request(app)
        .put(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(testJobId);
      expect(res.body.name).toEqual(updates.name);
      expect(res.body.startUrl).toEqual(updates.startUrl);
      expect(res.body.schedule).toEqual(updates.schedule);
      expect(res.body.jsRendering).toEqual(updates.jsRendering);
    });

    it('should return 404 if trying to update another user\'s job', async () => {
      const updates = { name: 'Admin Tries to Update' };
      const res = await request(app)
        .put(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`) // Admin tries to update user's job
        .send(updates);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Scraping job not found or unauthorized');
    });
  });

  describe('DELETE /api/scraping-jobs/:id', () => {
    let jobToDelete;
    beforeEach(async () => {
      jobToDelete = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Job to Delete',
        startUrl: 'http://example.com/delete',
        cssSelectors: [{ name: 'span', selector: '.remove' }],
      });
      testJobId = jobToDelete.id;
    });

    it('should delete a scraping job for the authorized user', async () => {
      const res = await request(app)
        .delete(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Scraping job removed');

      // Verify it's actually deleted
      const check = await ScrapingJob.findByPk(testJobId);
      expect(check).toBeNull();
    });

    it('should return 404 if trying to delete another user\'s job', async () => {
      const res = await request(app)
        .delete(`/api/scraping-jobs/${testJobId}`)
        .set('Authorization', `Bearer ${adminToken}`); // Admin tries to delete user's job

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Scraping job not found or unauthorized');
    });
  });

  describe('POST /api/scraping-jobs/:id/run', () => {
    let jobToRun;
    beforeEach(async () => {
      jobToRun = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Job to Run',
        startUrl: 'http://example.com/dynamic',
        cssSelectors: [{ name: 'mockedTitle', selector: 'h1' }],
        jsRendering: true, // This will trigger Puppeteer mock
      });
      testJobId = jobToRun.id;

      // Ensure mock is reset
      puppeteer.launch.mockClear();
    });

    it('should manually trigger and run a scraping job (Puppeteer)', async () => {
      const res = await request(app)
        .post(`/api/scraping-jobs/${testJobId}/run`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Scraping job initiated successfully');
      expect(res.body.result).toHaveProperty('id');
      expect(res.body.result.jobId).toEqual(testJobId);
      expect(res.body.result.data).toEqual({ mockedTitle: 'Mocked Puppeteer Title' });
      expect(res.body.result.status).toEqual('SUCCESS');
      expect(puppeteer.launch).toHaveBeenCalledTimes(1);

      // Verify job status updated
      const updatedJob = await ScrapingJob.findByPk(testJobId);
      expect(updatedJob.status).toEqual('COMPLETED');
      expect(updatedJob.runCount).toEqual(1);
    });

    it('should handle scraping failure gracefully', async () => {
      // Temporarily make puppeteer fail
      puppeteer.launch.mockImplementationOnce(() => {
        throw new Error('Mock Puppeteer failed');
      });

      const res = await request(app)
        .post(`/api/scraping-jobs/${testJobId}/run`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toEqual('Scraping job initiated successfully');
      expect(res.body.result.status).toEqual('FAILED');
      expect(res.body.result.errorMessage).toContain('Mock Puppeteer failed');

      // Verify job status updated
      const updatedJob = await ScrapingJob.findByPk(testJobId);
      expect(updatedJob.status).toEqual('FAILED');
    });
  });

  describe('GET /api/scraping-jobs/:id/results', () => {
    let jobWithResults;
    let result1, result2;
    beforeEach(async () => {
      jobWithResults = await ScrapingJob.create({
        userId: regularUser.id,
        name: 'Job With Results',
        startUrl: 'http://example.com/results',
        cssSelectors: [{ name: 'data', selector: 'p' }],
      });
      testJobId = jobWithResults.id;

      result1 = await jobWithResults.createResult({
        url: 'http://example.com/results',
        data: { item: 'data-1' },
        status: 'SUCCESS',
        scrapedAt: new Date(Date.now() - 60000), // Older
      });
      result2 = await jobWithResults.createResult({
        url: 'http://example.com/results',
        data: { item: 'data-2' },
        status: 'SUCCESS',
        scrapedAt: new Date(), // Newer
      });
    });

    it('should return all results for a specific job for the authorized user, ordered by scrapedAt DESC', async () => {
      const res = await request(app)
        .get(`/api/scraping-jobs/${testJobId}/results`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toEqual(2);
      expect(res.body[0].id).toEqual(result2.id); // Newer result first
      expect(res.body[1].id).toEqual(result1.id); // Older result second
      expect(res.body[0].jobId).toEqual(testJobId);
      expect(res.body[0].data).toEqual({ item: 'data-2' });
    });

    it('should return 404 if trying to get results for another user\'s job', async () => {
      const res = await request(app)
        .get(`/api/scraping-jobs/${testJobId}/results`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Scraping job not found or unauthorized');
    });
  });
});
```