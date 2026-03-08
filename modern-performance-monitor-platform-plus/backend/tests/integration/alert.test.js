```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const db = require('../../src/data-access/db');
const { userRepository, projectRepository, alertRepository } = require('../../src/data-access/repositories');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

describe('Alert routes', () => {
  let adminUser;
  let adminToken;
  let testProject;
  let testAlert;
  let testIncident;

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

    // Create a test project for alerts
    testProject = await projectRepository.create({
      id: uuidv4(),
      user_id: adminUser.id,
      name: 'Alert Test Project',
      description: 'Project for alert integration tests',
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

  describe('POST /api/v1/projects/:projectId/alerts', () => {
    it('should return 201 and create a new alert if authenticated and owner', async () => {
      const newAlert = {
        name: 'High Latency Alert',
        metricType: 'http_request',
        aggregationType: 'avg',
        field: 'durationMs',
        operator: '>',
        threshold: 500,
        timeWindowMinutes: 5,
        isEnabled: true,
      };

      const res = await request(app)
        .post(`/api/v1/projects/${testProject.id}/alerts`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newAlert)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name', newAlert.name);
      expect(res.body).toHaveProperty('project_id', testProject.id);
      testAlert = res.body;

      const dbAlert = await alertRepository.getAlertById(testAlert.id);
      expect(dbAlert).toBeDefined();
      expect(dbAlert.name).toBe(newAlert.name);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post(`/api/v1/projects/${testProject.id}/alerts`)
        .send({ name: 'Unauthorized Alert' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if required fields are missing for alert creation', async () => {
      const invalidAlert = {
        name: 'Incomplete Alert',
        metricType: 'http_request',
        // Missing aggregationType
        field: 'durationMs',
        operator: '>',
        threshold: 100,
        timeWindowMinutes: 1,
      };
      await request(app)
        .post(`/api/v1/projects/${testProject.id}/alerts`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidAlert)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/v1/projects/:projectId/alerts', () => {
    it('should return 200 and all alerts for a project if authenticated and owner', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}/alerts`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(testAlert.id);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get(`/api/v1/projects/${testProject.id}/alerts`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/projects/:projectId/alerts/:alertId', () => {
    it('should return 200 and the specific alert if authenticated and owner', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}/alerts/${testAlert.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testAlert.id);
      expect(res.body.name).toBe(testAlert.name);
    });

    it('should return 404 if alert not found or not owned', async () => {
      await request(app)
        .get(`/api/v1/projects/${testProject.id}/alerts/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/v1/projects/:projectId/alerts/:alertId', () => {
    it('should return 200 and update the alert if authenticated and owner', async () => {
      const updates = { isEnabled: false, threshold: 600 };
      const res = await request(app)
        .patch(`/api/v1/projects/${testProject.id}/alerts/${testAlert.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updates)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testAlert.id);
      expect(res.body.isEnabled).toBe(updates.isEnabled);
      expect(res.body.threshold).toBe(updates.threshold);

      const dbAlert = await alertRepository.getAlertById(testAlert.id);
      expect(dbAlert.isEnabled).toBe(updates.isEnabled);
      expect(dbAlert.threshold).toBe(updates.threshold);
    });
  });

  // Create an incident for incident-related tests
  beforeEach(async () => {
    await db('alert_incidents').del(); // Clear previous incidents
    testIncident = await alertRepository.createAlertIncident({
      id: uuidv4(),
      alert_id: testAlert.id,
      project_id: testProject.id,
      status: 'triggered',
      triggered_value: { value: 700 },
      triggered_at: new Date().toISOString(),
    });
  });

  describe('GET /api/v1/projects/:projectId/incidents', () => {
    it('should return 200 and alert incidents for a project if authenticated and owner', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}/incidents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.OK);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].id).toBe(testIncident.id);
      expect(res.body[0].status).toBe('triggered');
    });

    it('should filter incidents by status', async () => {
      // Create a resolved incident
      await alertRepository.createAlertIncident({
        id: uuidv4(),
        alert_id: testAlert.id,
        project_id: testProject.id,
        status: 'resolved',
        triggered_value: { value: 400 },
        triggered_at: new Date().toISOString(),
        resolved_at: new Date().toISOString(),
      });

      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}/incidents`)
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ status: 'triggered' })
        .expect(httpStatus.OK);

      expect(res.body.length).toBe(1);
      expect(res.body[0].status).toBe('triggered');
    });
  });

  describe('PATCH /api/v1/projects/:projectId/incidents/:incidentId/status', () => {
    it('should return 200 and update incident status to resolved', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${testProject.id}/incidents/${testIncident.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' })
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testIncident.id);
      expect(res.body.status).toBe('resolved');
      expect(res.body.resolved_at).not.toBeNull();

      const dbIncident = await alertRepository.getAlertIncidentById(testIncident.id);
      expect(dbIncident.status).toBe('resolved');
      expect(dbIncident.resolved_at).not.toBeNull();
    });

    it('should return 400 if invalid status is provided', async () => {
      await request(app)
        .patch(`/api/v1/projects/${testProject.id}/incidents/${testIncident.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 404 if incident not found or not owned', async () => {
      await request(app)
        .patch(`/api/v1/projects/${testProject.id}/incidents/${uuidv4()}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'acknowledged' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/v1/projects/:projectId/alerts/:alertId', () => {
    it('should return 204 and delete the alert if authenticated and owner', async () => {
      await request(app)
        .delete(`/api/v1/projects/${testProject.id}/alerts/${testAlert.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbAlert = await alertRepository.getAlertById(testAlert.id);
      expect(dbAlert).toBeUndefined();
    });

    it('should return 404 if alert not found for deletion', async () => {
      await request(app)
        .delete(`/api/v1/projects/${testProject.id}/alerts/${uuidv4()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
```