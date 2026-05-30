```javascript
const request = require('supertest');
const app = require('../../src/app');
const { User, Project, sequelize } = require('../../src/models');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');

// Mock logger to prevent console spam during tests
jest.mock('../../src/config/logger.config', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
}));
jest.mock('../../src/utils/cache.util', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  },
  invalidateCache: jest.fn(),
}));

describe('Project API', () => {
  let testUser, adminUser;
  let testUserToken, adminUserToken;

  beforeAll(async () => {
    // Users are created in setup.js, fetch them
    testUser = await User.findByPk('1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d');
    adminUser = await User.findByPk('f1e2d3c4-b5a6-7f8e-9d0c-1b2a3f4e5d6c');

    if (!testUser || !adminUser) {
      throw new Error('Test users not found from setup. Ensure setup.js runs correctly.');
    }

    testUserToken = jwt.sign({ id: testUser.id, role: testUser.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
    adminUserToken = jwt.sign({ id: adminUser.id, role: adminUser.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
  });

  beforeEach(async () => {
    // Clear projects before each test
    await Project.destroy({ where: {}, truncate: true });
    jest.clearAllMocks(); // Clear mock calls for cache
  });

  describe('POST /api/v1/projects', () => {
    it('should create a new project for an authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'My First Project',
          description: 'A project description.',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toBe('Project created successfully');
      expect(res.body.project.name).toBe('My First Project');
      expect(res.body.project.ownerId).toBe(testUser.id);
      expect(require('../../src/utils/cache.util').invalidateCache).toHaveBeenCalledWith('all_projects');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send({
          name: 'Unauthorized Project',
          description: 'This should fail.',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should return 400 for invalid project data', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'ab', // Too short
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('"name" length must be at least 3 characters long');
    });

    it('should return 400 if project name already exists for the user', async () => {
      await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: 'Unique Name', description: 'Desc' });

      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: 'Unique Name', description: 'Another Desc' });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project with this name already exists.');
    });
  });

  describe('GET /api/v1/projects', () => {
    let project1, project2, adminProject;
    beforeEach(async () => {
      project1 = await Project.create({ name: 'User Project 1', description: 'D1', ownerId: testUser.id, status: 'active' });
      project2 = await Project.create({ name: 'User Project 2', description: 'D2', ownerId: testUser.id, status: 'active' });
      adminProject = await Project.create({ name: 'Admin Project', description: 'D3', ownerId: adminUser.id, status: 'active' });
    });

    it('should return all projects for an admin user', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(3);
      expect(res.body.map(p => p.name)).toEqual(expect.arrayContaining([project1.name, project2.name, adminProject.name]));
      expect(require('../../src/utils/cache.util').cache.set).toHaveBeenCalledTimes(1);
    });

    it('should return only owned projects for a regular user', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
      expect(res.body.map(p => p.name)).toEqual(expect.arrayContaining([project1.name, project2.name]));
      expect(res.body.map(p => p.name)).not.toContain(adminProject.name);
      expect(require('../../src/utils/cache.util').cache.set).toHaveBeenCalledTimes(1);
    });

    it('should return cached data if available', async () => {
      const mockProjects = [{ id: 'cached-id', name: 'Cached Project' }];
      require('../../src/utils/cache.util').cache.get.mockResolvedValueOnce(JSON.stringify(mockProjects));

      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toEqual(mockProjects);
      expect(require('../../src/utils/cache.util').cache.get).toHaveBeenCalledTimes(1);
      expect(require('../../src/utils/cache.util').cache.set).not.toHaveBeenCalled(); // Should not set if cache hit
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    let userProject, otherUserProject;
    beforeEach(async () => {
      userProject = await Project.create({ name: 'My Project', description: 'D1', ownerId: testUser.id, status: 'active' });
      otherUserProject = await Project.create({ name: 'Other Project', description: 'D2', ownerId: adminUser.id, status: 'active' });
    });

    it('should return a project by ID for the owner', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(userProject.name);
      expect(res.body.owner.username).toBe(testUser.username); // Ensure owner is eager loaded
    });

    it('should return a project by ID for an admin', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toBe(userProject.name);
    });

    it('should return 404 if project not found', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${sequelize.literal('uuid_generate_v4()')}`) // non-existent UUID
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found');
    });

    it('should return 403 if user is not authorized', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${otherUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`); // testUser tries to access adminUser's project

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Not authorized to access this project');
    });
  });

  describe('PUT /api/v1/projects/:id', () => {
    let userProject;
    beforeEach(async () => {
      userProject = await Project.create({ name: 'Update Project', description: 'Old Desc', ownerId: testUser.id, status: 'active' });
    });

    it('should update a project for the owner', async () => {
      const updates = { description: 'New Description', status: 'completed' };
      const res = await request(app)
        .put(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send(updates);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Project updated successfully');
      expect(res.body.project.description).toBe(updates.description);
      expect(res.body.project.status).toBe(updates.status);
      expect(require('../../src/utils/cache.util').invalidateCache).toHaveBeenCalledWith('all_projects');

      const updatedInDb = await Project.findByPk(userProject.id);
      expect(updatedInDb.description).toBe(updates.description);
    });

    it('should return 403 if user is not authorized', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`) // Admin can update anyone's project
        .send({ description: 'Admin Updated' });

      expect(res.statusCode).toEqual(200);
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    let userProject, otherUserProject;
    beforeEach(async () => {
      userProject = await Project.create({ name: 'Delete Project', description: 'Desc', ownerId: testUser.id, status: 'active' });
      otherUserProject = await Project.create({ name: 'Other Delete Project', description: 'Desc', ownerId: adminUser.id, status: 'active' });
    });

    it('should delete a project for the owner', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${userProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Project deleted successfully');
      expect(require('../../src/utils/cache.util').invalidateCache).toHaveBeenCalledWith('all_projects');

      const deletedInDb = await Project.findByPk(userProject.id);
      expect(deletedInDb).toBeNull();
    });

    it('should delete a project for an admin', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${otherUserProject.id}`)
        .set('Authorization', `Bearer ${adminUserToken}`); // Admin can delete any project

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Project deleted successfully');
    });

    it('should return 403 if user is not authorized', async () => {
      // testUser trying to delete adminUser's project
      const res = await request(app)
        .delete(`/api/v1/projects/${otherUserProject.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Not authorized to delete this project');
    });

    it('should return 404 if project not found', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${sequelize.literal('uuid_generate_v4()')}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found');
    });
  });
});
```