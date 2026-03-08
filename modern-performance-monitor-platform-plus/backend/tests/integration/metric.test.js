```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const db = require('../../src/data-access/db');
const { userRepository, projectRepository, metricRepository } = require('../../src/data-access/repositories');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

describe('Metric routes', () => {
  let adminUser;
  let adminToken;
  let testProject;

  beforeAll(async () => {
    // Clear and re-seed database for a clean test state
    await db('alert_incidents').del();
    await db('alerts').del();
    await db('metric_data').del();
    await db('projects').del();
    await db('users').del();

    // Create an admin user to get an auth token
    const hashedPassword = await bcrypt.hash('adminpassword', 10);
    adminUser = await userRepository.create({
      id: uuidv4(),
      email: 'admin@example.com',
      password: hashedPassword,
      first_name: 'Admin',
      last_name: 'User'
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: adminUser.email, password: 'adminpassword' });
    adminToken = loginRes.body.tokens.accessToken;

    // Create a test project for metric ingestion
    testProject = await projectRepository.create({
      id: uuidv4(),
      user_id: adminUser.id,
      name: 'Integration Test Project',
      description: 'Project for metric integration tests',
      api_key: uuidv4()
    });
  });

  afterAll(async () => {
    await db('alert_incidents').del();
    await db('alerts').del();
    await db('metric_data').del();
    await db('projects').del();
    await db('users').del();
    await db.destroy();
  });

  const generateMetric = (type, data, timestampOffsetMinutes = 0) => ({
    metricType: type,
    timestamp: moment().subtract(timestampOffsetMinutes, 'minutes').toISOString(),
    data: data
  });

  describe('POST /api/v1/metrics/ingest', () => {
    it('should return 201 and ingest metric if API Key is valid', async () => {
      const metric = generateMetric('http_request', { url: '/home', method: 'GET', durationMs: 120, status: 200 });

      const res = await request(app)
        .post('/api/v1/metrics/ingest')
        .set('X-API-Key', testProject.api_key)
        .send(metric)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('message', 'Metric ingested successfully');
      expect(res.body).toHaveProperty('metricId');

      const dbMetric = await metricRepository.getMetrics(testProject.id, metric.metricType, moment().subtract(1, 'hour').toISOString(), moment().add(1, 'hour').toISOString());
      expect(dbMetric.length).toBe(1);
      expect(dbMetric[0].data.url).toBe(metric.data.url);
    });

    it('should return 401 if API Key is missing', async () => {
      const metric = generateMetric('http_request', { url: '/home', method: 'GET', durationMs: 120, status: 200 });
      await request(app)
        .post('/api/v1/metrics/ingest')
        .send(metric)
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 401 if API Key is invalid', async () => {
      const metric = generateMetric('http_request', { url: '/home', method: 'GET', durationMs: 120, status: 200 });
      await request(app)
        .post('/api/v1/metrics/ingest')
        .set('X-API-Key', 'invalid-api-key')
        .send(metric)
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if required metric fields are missing', async () => {
      await request(app)
        .post('/api/v1/metrics/ingest')
        .set('X-API-Key', testProject.api_key)
        .send({ timestamp: new Date().toISOString(), data: {} }) // Missing metricType
        .expect(httpStatus.BAD_REQUEST);

      await request(app)
        .post('/api/v1/metrics/ingest')
        .set('X-API-Key', testProject.api_key)
        .send({ metricType: 'custom', data: {} }) // Missing timestamp
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/metrics/:projectId', () => {
    beforeEach(async () => {
      await db('metric_data').del(); // Clear metrics for each test
      // Seed some metrics for querying
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { url: '/a', durationMs: 100 }, 5));
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { url: '/b', durationMs: 200 }, 10));
      await metricRepository.ingestMetric(testProject.id, generateMetric('error', { message: 'Failed' }, 15));
    });

    it('should return 200 and raw metrics for a project if authenticated', async () => {
      const startTime = moment().subtract(30, 'minutes').toISOString();
      const endTime = moment().add(1, 'minute').toISOString();

      const res = await request(app)
        .get(`/api/v1/metrics/${testProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ startTime, endTime, metricType: 'http_request' })
        .expect(httpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body[0].metric_type).toBe('http_request');
      expect(res.body[1].metric_type).toBe('http_request');
    });

    it('should return 401 if not authenticated', async () => {
      const startTime = moment().subtract(30, 'minutes').toISOString();
      const endTime = moment().add(1, 'minute').toISOString();
      await request(app)
        .get(`/api/v1/metrics/${testProject.id}`)
        .query({ startTime, endTime })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if startTime or endTime is missing', async () => {
      await request(app)
        .get(`/api/v1/metrics/${testProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ metricType: 'http_request' }) // Missing startTime/endTime
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/metrics/:projectId/aggregated', () => {
    beforeEach(async () => {
      await db('metric_data').del(); // Clear metrics
      // Seed data for aggregation: multiple http_request metrics
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { durationMs: 100 }, 5));
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { durationMs: 200 }, 5));
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { durationMs: 150 }, 10));
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { durationMs: 250 }, 10));
      await metricRepository.ingestMetric(testProject.id, generateMetric('http_request', { durationMs: 300 }, 65)); // 1 hour 5 mins ago
      await metricRepository.ingestMetric(testProject.id, generateMetric('error', { message: 'Failed' }, 15));
    });

    it('should return 200 and aggregated metrics by average duration', async () => {
      const startTime = moment().subtract(1, 'hour').toISOString();
      const endTime = moment().add(1, 'minute').toISOString();

      const res = await request(app)
        .get(`/api/v1/metrics/${testProject.id}/aggregated`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          metricType: 'http_request',
          field: 'durationMs',
          aggregationType: 'avg',
          startTime,
          endTime,
          interval: 'hour'
        })
        .expect(httpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('interval_start');
      expect(res.body[0]).toHaveProperty('value');
      expect(typeof res.body[0].value).toBe('number');
    });

    it('should return 400 if required query parameters are missing', async () => {
      const startTime = moment().subtract(1, 'hour').toISOString();
      const endTime = moment().add(1, 'minute').toISOString();

      await request(app)
        .get(`/api/v1/metrics/${testProject.id}/aggregated`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          metricType: 'http_request',
          field: 'durationMs',
          // Missing aggregationType
          startTime,
          endTime,
          interval: 'hour'
        })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 400 if aggregationType is invalid', async () => {
      const startTime = moment().subtract(1, 'hour').toISOString();
      const endTime = moment().add(1, 'minute').toISOString();

      await request(app)
        .get(`/api/v1/metrics/${testProject.id}/aggregated`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({
          metricType: 'http_request',
          field: 'durationMs',
          aggregationType: 'invalid', // Invalid type
          startTime,
          endTime,
          interval: 'hour'
        })
        .expect(httpStatus.BAD_REQUEST);
    });
  });
});
```