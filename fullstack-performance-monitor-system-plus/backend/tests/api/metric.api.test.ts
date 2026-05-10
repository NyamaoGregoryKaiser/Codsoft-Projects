import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database/prisma-client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { redis } from '../../src/database/redis-client'; // Import redis client
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
const JWT_SECRET = process.env.JWT_SECRET!;
const API_KEY_HEADER = process.env.API_KEY_HEADER || 'x-appinsight-api-key';

describe('Metric API E2E Tests', () => {
  let testUser: any;
  let authToken: string;
  let testProject: any;

  beforeEach(async () => {
    // Clear Redis before each test to ensure no stale cache interferes
    await redis.flushdb();

    const hashedPassword = await bcrypt.hash('password123', 12);
    testUser = await prisma.user.create({
      data: {
        name: 'Metric Test User',
        email: 'metrictest@example.com',
        passwordHash: hashedPassword,
      },
    });
    authToken = jwt.sign({ id: testUser.id }, JWT_SECRET, { expiresIn: '1h' });
    testProject = await prisma.project.create({
      data: { name: 'Monitored App', ownerId: testUser.id, apikey: 'test-api-key-123' },
    });
  });

  describe('POST /api/metrics/ingest', () => {
    it('should ingest metrics successfully with a valid API key', async () => {
      const res = await request(app)
        .post('/api/metrics/ingest')
        .set(API_KEY_HEADER, testProject.apikey)
        .send({
          metrics: [
            {
              type: 'LCP',
              value: 1200,
              timestamp: new Date().toISOString(),
              context: { url: '/home', device: 'desktop' },
            },
            {
              type: 'FID',
              value: 50,
              timestamp: new Date().toISOString(),
              context: { url: '/about', interaction: 'click' },
            },
          ],
        });

      expect(res.statusCode).toEqual(202);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toBe('Metrics accepted for processing');

      const metricsInDb = await prisma.metric.findMany({ where: { projectId: testProject.id } });
      expect(metricsInDb.length).toBe(2);
      expect(metricsInDb[0].type).toBe('LCP');
      expect(metricsInDb[1].type).toBe('FID');
    });

    it('should return 401 for missing API key', async () => {
      const res = await request(app)
        .post('/api/metrics/ingest')
        .send({
          metrics: [
            { type: 'LCP', value: 1200, timestamp: new Date().toISOString() },
          ],
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('API Key is required to submit metrics.');
    });

    it('should return 401 for invalid API key', async () => {
      const res = await request(app)
        .post('/api/metrics/ingest')
        .set(API_KEY_HEADER, 'invalid-api-key')
        .send({
          metrics: [
            { type: 'LCP', value: 1200, timestamp: new Date().toISOString() },
          ],
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Invalid API Key.');
    });

    it('should return 400 for invalid metric data', async () => {
      const res = await request(app)
        .post('/api/metrics/ingest')
        .set(API_KEY_HEADER, testProject.apikey)
        .send({
          metrics: [
            { type: 'INVALID_TYPE', value: 100, timestamp: new Date().toISOString() }, // Invalid type
          ],
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Invalid enum value/);
    });
  });

  describe('GET /api/metrics/:projectId/summary', () => {
    beforeEach(async () => {
      const now = new Date();
      // Metrics for the last 24 hours
      await prisma.metric.createMany({
        data: [
          { projectId: testProject.id, type: 'LCP', value: 1000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2) },
          { projectId: testProject.id, type: 'LCP', value: 2000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 1) },
          { projectId: testProject.id, type: 'FID', value: 50, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 3) },
          { projectId: testProject.id, type: 'CLS', value: 0.1, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4) },
          { projectId: testProject.id, type: 'ERROR', value: 1, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5), context: { message: 'JS Error' } },
          // Older metric (outside 1 day default period)
          { projectId: testProject.id, type: 'LCP', value: 5000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 30) },
        ],
      });
    });

    it('should return project summary metrics for the default period (1 day)', async () => {
      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.LCP.avg).toBeCloseTo(1500); // (1000 + 2000) / 2
      expect(res.body.data.FID.avg).toBe(50);
      expect(res.body.data.CLS.avg).toBe(0.1);
      expect(res.body.data.totalErrors).toBe(1);
    });

    it('should return project summary metrics for a specified period (e.g., 6h)', async () => {
      const now = new Date();
      // Add a metric within 6 hours
      await prisma.metric.create({
        projectId: testProject.id, type: 'LCP', value: 3000, timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 0.5)
      });

      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/summary?period=6h`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.LCP.avg).toBeCloseTo(3000); // Only the new metric within 6 hours
    });

    it('should use cache for subsequent requests', async () => {
      // First request (miss)
      await request(app)
        .get(`/api/metrics/${testProject.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      const initialRedisCalls = (redis.call as jest.Mock).mock.calls.length;

      // Second request (hit)
      await request(app)
        .get(`/api/metrics/${testProject.id}/summary`)
        .set('Authorization', `Bearer ${authToken}`);

      // Expect Redis.get to be called, but not Prisma.aggregate again
      const finalRedisCalls = (redis.call as jest.Mock).mock.calls.length;
      expect(finalRedisCalls).toBeGreaterThan(initialRedisCalls); // get call
      // We can't easily mock Prisma to count calls directly, but checking Redis helps.
      // In a more robust test, we'd mock prisma client to ensure no db calls on cache hit.
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get(`/api/metrics/${testProject.id}/summary`);
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if project not owned by user', async () => {
      const otherUserHashedPassword = await bcrypt.hash('otherpassword', 12);
      const otherUser = await prisma.user.create({
        data: { name: 'Other User', email: 'other@user.com', passwordHash: otherUserHashedPassword },
      });
      const otherUserToken = jwt.sign({ id: otherUser.id }, JWT_SECRET, { expiresIn: '1h' });

      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/summary`)
        .set('Authorization', `Bearer ${otherUserToken}`);
      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /api/metrics/:projectId/timeline', () => {
    beforeEach(async () => {
      const now = new Date();
      // Simulate hourly data points for LCP
      for (let i = 0; i < 5; i++) { // Last 5 hours
        await prisma.metric.create({
          projectId: testProject.id,
          type: 'LCP',
          value: 1000 + i * 100, // Increasing LCP
          timestamp: new Date(now.getTime() - 1000 * 60 * 60 * (5 - i)),
        });
      }
      // Add some more LCP for averaging within an hour
      await prisma.metric.create({
        projectId: testProject.id,
        type: 'LCP',
        value: 1500,
        timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 4.5), // half an hour after first 5hr LCP
      });
    });

    it('should return timeline data for a specific metric type', async () => {
      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/timeline?metricType=LCP&period=1d`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBeGreaterThanOrEqual(5); // At least 5 distinct hour aggregates

      // Check some aggregated values (approximate due to in-memory aggregation)
      const firstHourEntry = res.body.data[0];
      expect(firstHourEntry.value).toBeCloseTo(1000); // Initial 1000 LCP

      const secondHourEntry = res.body.data[1];
      expect(secondHourEntry.value).toBeCloseTo((1100 + 1500) / 2); // 1100 + 1500, averaged
    });

    it('should return 400 if metricType is missing', async () => {
      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/timeline?period=1d`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/Required/);
    });
  });

  describe('GET /api/metrics/:projectId/errors', () => {
    beforeEach(async () => {
      const now = new Date();
      await prisma.metric.createMany({
        data: [
          { projectId: testProject.id, type: 'ERROR', value: 1, timestamp: new Date(now.getTime() - 1000 * 60 * 5), context: { message: 'Error A', url: '/p1' } },
          { projectId: testProject.id, type: 'ERROR', value: 1, timestamp: new Date(now.getTime() - 1000 * 60 * 10), context: { message: 'Error B', url: '/p2' } },
          { projectId: testProject.id, type: 'LCP', value: 1000, timestamp: new Date(now.getTime() - 1000 * 60 * 15) }, // Not an error
          { projectId: testProject.id, type: 'ERROR', value: 1, timestamp: new Date(now.getTime() - 1000 * 60 * 2), context: { message: 'Error C', url: '/p3' } },
        ],
      });
    });

    it('should return recent errors for a project', async () => {
      const res = await request(app)
        .get(`/api/metrics/${testProject.id}/errors`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(res.body.data.length).toBe(3); // Should only get ERROR types
      expect(res.body.data[0].context.message).toBe('Error C'); // Ordered by timestamp desc
      expect(res.body.data[1].context.message).toBe('Error A');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get(`/api/metrics/${testProject.id}/errors`);
      expect(res.statusCode).toEqual(401);
    });
  });
});