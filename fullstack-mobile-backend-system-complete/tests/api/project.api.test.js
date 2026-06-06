```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const { generateAuthTokens } = require('../../src/config/jwt');

let adminUser, regularUser, adminAccessToken, regularAccessToken;
let testProject;

// Helper to clean database
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeAll(async () => {
  await cleanUpDb();

  // Create users and get tokens
  adminUser = await userService.createUser({ name: 'Admin', email: 'project_admin@example.com', password: 'Password123!', role: 'ADMIN' });
  regularUser = await userService.createUser({ name: 'User', email: 'project_user@example.com', password: 'Password123!', role: 'USER' });

  adminAccessToken = (await generateAuthTokens(adminUser)).accessToken;
  regularAccessToken = (await generateAuthTokens(regularUser)).accessToken;
});

beforeEach(async () => {
  await prisma.project.deleteMany();
  testProject = await prisma.project.create({
    data: {
      name: 'Test Project',
      description: 'Description for test project',
      ownerId: regularUser.id,
      status: 'PENDING',
    },
  });
});

afterAll(async () => {
  await cleanUpDb();
  await prisma.$disconnect();
});

describe('Project Routes', () => {
  describe('POST /v1/projects', () => {
    it('should return 201 and create a project for an authenticated user', async () => {
      const newProject = {
        name: 'New Project API',
        description: 'Project created via API',
      };

      const res = await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send(newProject)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(newProject.name);
      expect(res.body.ownerId).toBe(regularUser.id);

      const projectInDb = await prisma.project.findUnique({ where: { id: res.body.id } });
      expect(projectInDb).toBeDefined();
      expect(projectInDb.name).toBe(newProject.name);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/v1/projects')
        .send({ name: 'Unauth Project' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if validation fails (e.g., missing name)', async () => {
      await request(app)
        .post('/v1/projects')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ description: 'Missing name' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/projects', () => {
    it('should return 200 and all projects for an admin', async () => {
      // Create a project owned by admin too
      await prisma.project.create({ data: { name: 'Admin Project', ownerId: adminUser.id } });

      const res = await request(app)
        .get('/v1/projects')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(2); // testProject + Admin Project
      expect(res.body.totalResults).toBe(2);
    });

    it('should return 200 and only user-owned projects for a regular user', async () => {
      // Create a project owned by admin
      await prisma.project.create({ data: { name: 'Admin Project', ownerId: adminUser.id } });

      const res = await request(app)
        .get('/v1/projects')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1); // Only testProject owned by regularUser
      expect(res.body.results[0].id).toBe(testProject.id);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/v1/projects')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should filter projects by name', async () => {
      await prisma.project.create({ data: { name: 'Another Project', ownerId: regularUser.id } });

      const res = await request(app)
        .get('/v1/projects?name=test')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].name).toBe('Test Project');
    });
  });

  describe('GET /v1/projects/:projectId', () => {
    it('should return 200 and the project if user is owner', async () => {
      const res = await request(app)
        .get(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testProject.id);
      expect(res.body.name).toBe(testProject.name);
    });

    it('should return 200 and the project if user is admin', async () => {
      const res = await request(app)
        .get(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testProject.id);
      expect(res.body.name).toBe(testProject.name);
    });

    it('should return 403 if user is not owner or admin', async () => {
      const otherUser = await userService.createUser({ name: 'Other', email: 'other@example.com', password: 'Password123!', role: 'USER' });
      const otherAccessToken = (await generateAuthTokens(otherUser)).accessToken;

      await request(app)
        .get(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 404 if project not found', async () => {
      await request(app)
        .get('/v1/projects/non-existent-id')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/projects/:projectId', () => {
    it('should return 200 and update the project if user is owner', async () => {
      const updateBody = { name: 'Updated Project Name', status: 'IN_PROGRESS' };

      const res = await request(app)
        .patch(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testProject.id);
      expect(res.body.name).toBe(updateBody.name);
      expect(res.body.status).toBe(updateBody.status);

      const projectInDb = await prisma.project.findUnique({ where: { id: testProject.id } });
      expect(projectInDb.name).toBe(updateBody.name);
      expect(projectInDb.status).toBe(updateBody.status);
    });

    it('should return 200 and update the project if user is admin', async () => {
      const updateBody = { description: 'Updated by Admin' };

      const res = await request(app)
        .patch(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(testProject.id);
      expect(res.body.description).toBe(updateBody.description);
    });

    it('should return 403 if user is not owner or admin', async () => {
      const otherUser = await userService.createUser({ name: 'Other', email: 'other2@example.com', password: 'Password123!', role: 'USER' });
      const otherAccessToken = (await generateAuthTokens(otherUser)).accessToken;

      await request(app)
        .patch(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ name: 'Forbidden Update' })
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 404 if project not found', async () => {
      await request(app)
        .patch('/v1/projects/non-existent-id')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: 'Non Existent' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /v1/projects/:projectId', () => {
    it('should return 204 and delete the project if user is owner', async () => {
      await request(app)
        .delete(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const projectInDb = await prisma.project.findUnique({ where: { id: testProject.id } });
      expect(projectInDb).toBeNull();
    });

    it('should return 204 and delete the project if user is admin', async () => {
      const adminOwnedProject = await prisma.project.create({ data: { name: 'Admin Owned', ownerId: adminUser.id } });

      await request(app)
        .delete(`/v1/projects/${adminOwnedProject.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const projectInDb = await prisma.project.findUnique({ where: { id: adminOwnedProject.id } });
      expect(projectInDb).toBeNull();
    });

    it('should return 403 if user is not owner or admin', async () => {
      const otherUser = await userService.createUser({ name: 'Other 3', email: 'other3@example.com', password: 'Password123!', role: 'USER' });
      const otherAccessToken = (await generateAuthTokens(otherUser)).accessToken;

      await request(app)
        .delete(`/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 404 if project not found', async () => {
      await request(app)
        .delete('/v1/projects/non-existent-id')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
```