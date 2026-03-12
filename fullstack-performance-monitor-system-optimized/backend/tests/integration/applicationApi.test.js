```javascript
const request = require('supertest');
const app = require('../../app');
const { sequelize, User, Application } = require('../../models');
const { generateToken } = require('../../utils/jwt');
const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');

// Temporarily adjust logger level for tests to avoid cluttering test output,
// or use a mock logger if needed to assert specific log calls.
logger.level = 'error'; // Only log errors during integration tests

let testUser;
let testToken;
let testApp;
let otherUser;
let otherToken;

beforeAll(async () => {
  // Ensure the database is clean before running tests.
  // This is handled by `backend/tests/setup.js` via `sequelize.sync({ force: true })`.
  // Here, we just ensure models are loaded and ready.

  // Create a test user
  const hashedPassword = await bcrypt.hash('testpassword', 10);
  testUser = await User.create({
    username: 'integration_test_user',
    email: 'integration_test@example.com',
    passwordHash: hashedPassword,
  });
  testToken = generateToken({ id: testUser.id });

  // Create another user for unauthorized access tests
  const otherHashedPassword = await bcrypt.hash('otherpassword', 10);
  otherUser = await User.create({
    username: 'other_user',
    email: 'other@example.com',
    passwordHash: otherHashedPassword,
  });
  otherToken = generateToken({ id: otherUser.id });

  // Create an application for the test user
  testApp = await Application.create({
    userId: testUser.id,
    name: 'Integration Test App',
    description: 'App for API integration tests',
    apiKey: 'test-api-key-123',
  });
});

afterAll(async () => {
  // Clean up test data after all tests
  await Application.destroy({ where: { userId: testUser.id }, force: true });
  await Application.destroy({ where: { userId: otherUser.id }, force: true });
  await User.destroy({ where: { id: testUser.id }, force: true });
  await User.destroy({ where: { id: otherUser.id }, force: true });
});

describe('Application API Integration Tests', () => {
  describe('POST /api/applications', () => {
    it('should create a new application for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'My New App',
          description: 'A brand new app for testing',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('My New App');
      expect(res.body.data.userId).toBe(testUser.id);
      expect(res.body.data).toHaveProperty('apiKey');

      // Verify it was saved to DB
      const appInDb = await Application.findByPk(res.body.data.id);
      expect(appInDb).not.toBeNull();
      expect(appInDb.name).toBe('My New App');
    });

    it('should return 400 if application name is missing', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          description: 'App without a name',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('Application name is required');
    });

    it('should return 409 if application name already exists for user', async () => {
      // First app created in beforeAll: 'Integration Test App'
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: 'Integration Test App',
          description: 'Duplicate name attempt',
        });

      expect(res.statusCode).toEqual(409);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toContain('You already have an application with this name.');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({
          name: 'Unauthorized App',
          description: 'Should not be created',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Authentication token required.');
    });
  });

  describe('GET /api/applications', () => {
    it('should retrieve all applications for the authenticated user', async () => {
      // Create another app for the test user
      await Application.create({
        userId: testUser.id,
        name: 'Another User App',
        description: 'Another app for integration tests',
      });

      const res = await request(app)
        .get('/api/applications')
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2); // At least 'Integration Test App' + 'My New App' + 'Another User App'
      expect(res.body.data.some(app => app.name === 'Integration Test App')).toBe(true);
      expect(res.body.data.some(app => app.name === 'Another User App')).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/applications');

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
    });
  });

  describe('GET /api/applications/:appId', () => {
    it('should retrieve a single application by ID for the owner', async () => {
      const res = await request(app)
        .get(`/api/applications/${testApp.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(testApp.id);
      expect(res.body.data.name).toBe(testApp.name);
      expect(res.body.data.userId).toBe(testUser.id);
    });

    it('should return 404 if application does not exist', async () => {
      const nonExistentId = 'f0000000-0000-4000-8000-000000000000'; // Valid UUID format, but non-existent
      const res = await request(app)
        .get(`/api/applications/${nonExistentId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Application not found.');
    });

    it('should return 403 if user does not own the application', async () => {
      const res = await request(app)
        .get(`/api/applications/${testApp.id}`)
        .set('Authorization', `Bearer ${otherToken}`); // Other user's token

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Forbidden: You do not own this application.');
    });
  });

  describe('PATCH /api/applications/:appId', () => {
    it('should update an application for the owner', async () => {
      const updatedName = 'Updated Integration App';
      const updatedDescription = 'This app has been updated.';

      const res = await request(app)
        .patch(`/api/applications/${testApp.id}`)
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          name: updatedName,
          description: updatedDescription,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.id).toBe(testApp.id);
      expect(res.body.data.name).toBe(updatedName);
      expect(res.body.data.description).toBe(updatedDescription);

      // Verify update in DB
      const appInDb = await Application.findByPk(testApp.id);
      expect(appInDb.name).toBe(updatedName);
      expect(appInDb.description).toBe(updatedDescription);

      // Update testApp reference for subsequent tests
      testApp.name = updatedName;
      testApp.description = updatedDescription;
    });

    it('should return 403 if user does not own the application', async () => {
      const res = await request(app)
        .patch(`/api/applications/${testApp.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ name: 'Attempted Update' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Forbidden: You do not own this application.');
    });
  });

  describe('POST /api/applications/:appId/regenerate-api-key', () => {
    it('should regenerate API key for the owner', async () => {
      const oldApiKey = testApp.apiKey;
      const res = await request(app)
        .post(`/api/applications/${testApp.id}/regenerate-api-key`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('apiKey');
      expect(res.body.data.apiKey).not.toBe(oldApiKey);

      // Update testApp reference
      testApp.apiKey = res.body.data.apiKey;

      // Verify in DB
      const appInDb = await Application.findByPk(testApp.id);
      expect(appInDb.apiKey).toBe(testApp.apiKey);
    });

    it('should return 403 if user does not own the application', async () => {
      const res = await request(app)
        .post(`/api/applications/${testApp.id}/regenerate-api-key`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Forbidden: You do not own this application.');
    });
  });

  describe('DELETE /api/applications/:appId', () => {
    it('should delete an application for the owner', async () => {
      // Create a temporary app to delete
      const appToDelete = await Application.create({
        userId: testUser.id,
        name: 'App to Delete',
        description: 'Will be deleted',
      });

      const res = await request(app)
        .delete(`/api/applications/${appToDelete.id}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body).toEqual({}); // 204 No Content typically has no body

      // Verify deletion in DB
      const appInDb = await Application.findByPk(appToDelete.id);
      expect(appInDb).toBeNull();
    });

    it('should return 403 if user does not own the application', async () => {
      const res = await request(app)
        .delete(`/api/applications/${testApp.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Forbidden: You do not own this application.');
    });

    it('should return 404 if application does not exist', async () => {
      const nonExistentId = 'e0000000-0000-4000-8000-000000000000';
      const res = await request(app)
        .delete(`/api/applications/${nonExistentId}`)
        .set('Authorization', `Bearer ${testToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Application not found.');
    });
  });
});
```