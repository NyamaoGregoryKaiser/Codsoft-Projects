const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../../src/app');
const setupTestDB = require('../../utils/setupTestDB');
const { User, Target } = require('../../../src/db/models');
const { insertUsers, adminUser, userOne } = require('../../fixtures/user.fixture');
const { targetOne, targetTwo, insertTargets } = require('../../fixtures/target.fixture');
const { generateAuthTokens } = require('../../../src/utils/jwt');

// Setup a test database and clean it up before/after tests
setupTestDB();

describe('Target Routes', () => {
  let adminAccessToken;
  let userOneAccessToken;

  beforeEach(async () => {
    await insertUsers([adminUser, userOne]);
    adminAccessToken = generateAuthTokens(adminUser).access.token;
    userOneAccessToken = generateAuthTokens(userOne).access.token;
  });

  describe('POST /api/targets', () => {
    let newTarget;

    beforeEach(() => {
      newTarget = {
        name: 'New Test Target',
        url: 'https://example.com/new',
        selectors: { title: 'h1', description: '.description' },
        schedule: '0 0 * * *',
      };
    });

    test('should return 201 and successfully create new target if authenticated as admin', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTarget)
        .expect(httpStatus.CREATED);

      expect(res.body).toEqual(expect.objectContaining({
        id: expect.any(String),
        name: newTarget.name,
        url: newTarget.url,
        selectors: newTarget.selectors,
        schedule: newTarget.schedule,
        userId: adminUser.id,
      }));

      const dbTarget = await Target.findByPk(res.body.id);
      expect(dbTarget).toBeDefined();
      expect(dbTarget.name).toBe(newTarget.name);
      expect(dbTarget.userId).toBe(adminUser.id);
    });

    test('should return 201 and successfully create new target if authenticated as user', async () => {
      const res = await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(newTarget)
        .expect(httpStatus.CREATED);

      expect(res.body.userId).toBe(userOne.id);

      const dbTarget = await Target.findByPk(res.body.id);
      expect(dbTarget).toBeDefined();
      expect(dbTarget.userId).toBe(userOne.id);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app)
        .post('/api/targets')
        .send(newTarget)
        .expect(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 if required fields are missing', async () => {
      await request(app)
        .post('/api/targets')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Invalid Target' }) // Missing URL and selectors
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/targets', () => {
    beforeEach(async () => {
      await insertTargets([targetOne, targetTwo]);
    });

    test('should return 200 and all targets if authenticated as admin', async () => {
      const res = await request(app)
        .get('/api/targets')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.rows).toHaveLength(2);
      expect(res.body.rows[0].id).toEqual(targetOne.id); // Assuming default sort order
    });

    test('should return 200 and only user-specific targets if authenticated as non-admin', async () => {
      const res = await request(app)
        .get('/api/targets')
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.rows).toHaveLength(1);
      expect(res.body.rows[0].id).toEqual(targetOne.id);
      expect(res.body.rows[0].userId).toEqual(userOne.id);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app)
        .get('/api/targets')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/targets/:targetId', () => {
    beforeEach(async () => {
      await insertTargets([targetOne, targetTwo]);
    });

    test('should return 200 and target object if authenticated and target exists (admin)', async () => {
      const res = await request(app)
        .get(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(targetOne.id);
      expect(res.body.name).toEqual(targetOne.name);
    });

    test('should return 200 and target object if authenticated and target belongs to user', async () => {
      const res = await request(app)
        .get(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(targetOne.id);
      expect(res.body.userId).toEqual(userOne.id);
    });

    test('should return 403 if authenticated user tries to access another user\'s target', async () => {
      // targetTwo belongs to adminUser
      await request(app)
        .get(`/api/targets/${targetTwo.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if target not found', async () => {
      await request(app)
        .get('/api/targets/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/targets/:targetId', () => {
    beforeEach(async () => {
      await insertTargets([targetOne, targetTwo]);
    });

    test('should return 200 and update target object if authenticated and target exists (admin)', async () => {
      const updateBody = { name: 'Updated Target Name', schedule: '0 0 1 * *' };
      const res = await request(app)
        .patch(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(targetOne.id);
      expect(res.body.name).toEqual(updateBody.name);
      expect(res.body.schedule).toEqual(updateBody.schedule);

      const dbTarget = await Target.findByPk(targetOne.id);
      expect(dbTarget.name).toEqual(updateBody.name);
      expect(dbTarget.schedule).toEqual(updateBody.schedule);
    });

    test('should return 200 and update target object if authenticated and target belongs to user', async () => {
      const updateBody = { url: 'https://updated.example.com' };
      const res = await request(app)
        .patch(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(targetOne.id);
      expect(res.body.url).toEqual(updateBody.url);

      const dbTarget = await Target.findByPk(targetOne.id);
      expect(dbTarget.url).toEqual(updateBody.url);
    });

    test('should return 403 if authenticated user tries to update another user\'s target', async () => {
      // targetTwo belongs to adminUser
      const updateBody = { name: 'Forbidden Update' };
      await request(app)
        .patch(`/api/targets/${targetTwo.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if target not found', async () => {
      const updateBody = { name: 'Non-existent Update' };
      await request(app)
        .patch('/api/targets/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/targets/:targetId', () => {
    beforeEach(async () => {
      await insertTargets([targetOne, targetTwo]);
    });

    test('should return 204 if authenticated and target exists (admin)', async () => {
      await request(app)
        .delete(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTarget = await Target.findByPk(targetOne.id);
      expect(dbTarget).toBeNull();
    });

    test('should return 204 if authenticated and target belongs to user', async () => {
      await request(app)
        .delete(`/api/targets/${targetOne.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTarget = await Target.findByPk(targetOne.id);
      expect(dbTarget).toBeNull();
    });

    test('should return 403 if authenticated user tries to delete another user\'s target', async () => {
      // targetTwo belongs to adminUser
      await request(app)
        .delete(`/api/targets/${targetTwo.id}`)
        .set('Authorization', `Bearer ${userOneAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if target not found', async () => {
      await request(app)
        .delete('/api/targets/non-existent-id')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});