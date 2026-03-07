```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { sequelize, User, Project, Task, Comment } = require('../../src/models');
const { generateAuthTokens } = require('../../src/utils/jwt');
const { v4: uuidv4 } = require('uuid');
const setupTestDB = require('../utils/setupTestDB');

setupTestDB();

describe('Project routes', () => {
  let user1, user2, admin;
  let user1AccessToken, user2AccessToken, adminAccessToken;
  let project1, project2;

  beforeEach(async () => {
    await sequelize.sync({ force: true }); // Clean DB for each test

    user1 = await User.create({ id: uuidv4(), name: 'User 1', email: 'user1@example.com', password: 'password123', role: 'user' });
    user2 = await User.create({ id: uuidv4(), name: 'User 2', email: 'user2@example.com', password: 'password123', role: 'user' });
    admin = await User.create({ id: uuidv4(), name: 'Admin', email: 'admin@example.com', password: 'password123', role: 'admin' });

    user1AccessToken = generateAuthTokens(user1).access.token;
    user2AccessToken = generateAuthTokens(user2).access.token;
    adminAccessToken = generateAuthTokens(admin).access.token;

    project1 = await Project.create({
      id: uuidv4(),
      name: 'User1 Project',
      description: 'Project owned by User1',
      ownerId: user1.id,
      status: 'active',
    });
    await project1.addMember(user1); // Owner is also a member
    await project1.addMember(user2); // User2 is a member of Project1

    project2 = await Project.create({
      id: uuidv4(),
      name: 'Admin Project',
      description: 'Project owned by Admin',
      ownerId: admin.id,
      status: 'pending',
    });
    await project2.addMember(admin);
  });

  describe('POST /api/projects', () => {
    test('should return 201 and create a project if data is valid and user is authenticated', async () => {
      const newProject = {
        name: 'New Project by User1',
        description: 'This is a brand new project.',
        status: 'pending',
      };
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newProject)
        .expect(httpStatus.CREATED);

      expect(res.body.name).toEqual(newProject.name);
      expect(res.body.ownerId).toEqual(user1.id);
      expect(res.body.members.length).toBeGreaterThanOrEqual(1); // At least owner should be member
      expect(res.body.members[0].id).toEqual(user1.id);

      const dbProject = await Project.findByPk(res.body.id, { include: { model: User, as: 'members' } });
      expect(dbProject).toBeDefined();
      expect(dbProject.name).toEqual(newProject.name);
      expect(dbProject.ownerId).toEqual(user1.id);
      expect(dbProject.members.some(member => member.id === user1.id)).toBe(true);
    });

    test('should return 401 if access token is missing', async () => {
      await request(app)
        .post('/api/projects')
        .send({ name: 'Unauthorized Project' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/projects', () => {
    test('should return 200 and all projects for admin', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(2); // project1, project2
      expect(res.body[0].name).toBeDefined();
      expect(res.body[1].name).toBeDefined();
    });

    test('should return 200 and only projects where user is owner or member', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(2); // user1 owns project1, is member of project2 (implicitly from seed, but this is the test setup)
      expect(res.body.some(p => p.id === project1.id)).toBe(true);
      expect(res.body.some(p => p.id === project2.id)).toBe(true);
    });

    test('should return 200 and projects where user is member', async () => {
      // User2 is a member of project1
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveLength(1); // User2 is only member of project1
      expect(res.body[0].id).toEqual(project1.id);
    });
  });

  describe('GET /api/projects/:projectId', () => {
    test('should return 200 and project if user is owner', async () => {
      const res = await request(app)
        .get(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.name).toEqual(project1.name);
      expect(res.body.owner.id).toEqual(user1.id);
      expect(res.body.members).toHaveLength(2); // User1, User2
    });

    test('should return 200 and project if user is member', async () => {
      const res = await request(app)
        .get(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.name).toEqual(project1.name);
      expect(res.body.members).toHaveLength(2);
    });

    test('should return 403 if user is neither owner nor member (and not admin)', async () => {
      // Create a third user who is not involved in any existing projects
      const user3 = await User.create({ id: uuidv4(), name: 'User 3', email: 'user3@example.com', password: 'password123', role: 'user' });
      const user3AccessToken = generateAuthTokens(user3).access.token;

      await request(app)
        .get(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user3AccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if project not found', async () => {
      await request(app)
        .get(`/api/projects/${uuidv4()}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/projects/:projectId', () => {
    test('should return 200 and update project if user is owner', async () => {
      const updateBody = { status: 'completed' };
      const res = await request(app)
        .patch(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.status).toEqual('completed');
    });

    test('should return 200 and update project if user is admin', async () => {
      const updateBody = { status: 'completed' };
      const res = await request(app)
        .patch(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.status).toEqual('completed');
    });

    test('should return 403 if user is a member but not owner or admin', async () => {
      const updateBody = { status: 'completed' };
      await request(app)
        .patch(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member of project1
        .send(updateBody)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if project not found', async () => {
      await request(app)
        .patch(`/api/projects/${uuidv4()}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ status: 'completed' })
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /api/projects/:projectId', () => {
    test('should return 204 if user is owner', async () => {
      await request(app)
        .delete(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbProject = await Project.findByPk(project1.id);
      expect(dbProject).toBeNull();
    });

    test('should return 204 if user is admin', async () => {
      await request(app)
        .delete(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbProject = await Project.findByPk(project1.id);
      expect(dbProject).toBeNull();
    });

    test('should return 403 if user is a member but not owner or admin', async () => {
      await request(app)
        .delete(`/api/projects/${project1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if project not found', async () => {
      await request(app)
        .delete(`/api/projects/${uuidv4()}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('POST /api/projects/:projectId/members', () => {
    test('should add a member to the project if authorized', async () => {
      const newUserToAdd = await User.create({ id: uuidv4(), name: 'New Member', email: 'newmember@example.com', password: 'password123', role: 'user' });

      const res = await request(app)
        .post(`/api/projects/${project1.id}/members`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ userId: newUserToAdd.id })
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.members.some(m => m.id === newUserToAdd.id)).toBe(true);

      const dbProject = await Project.findByPk(project1.id, { include: { model: User, as: 'members' } });
      expect(dbProject.members.some(m => m.id === newUserToAdd.id)).toBe(true);
    });

    test('should return 403 if not owner or admin tries to add member', async () => {
      const newUserToAdd = await User.create({ id: uuidv4(), name: 'New Member', email: 'newmember2@example.com', password: 'password123', role: 'user' });
      await request(app)
        .post(`/api/projects/${project1.id}/members`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member, not owner
        .send({ userId: newUserToAdd.id })
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe('DELETE /api/projects/:projectId/members', () => {
    test('should remove a member from the project if authorized', async () => {
      const res = await request(app)
        .delete(`/api/projects/${project1.id}/members`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ userId: user2.id })
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(project1.id);
      expect(res.body.members.some(m => m.id === user2.id)).toBe(false);

      const dbProject = await Project.findByPk(project1.id, { include: { model: User, as: 'members' } });
      expect(dbProject.members.some(m => m.id === user2.id)).toBe(false);
    });

    test('should return 403 if not owner or admin tries to remove member', async () => {
      await request(app)
        .delete(`/api/projects/${project1.id}/members`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member, not owner
        .send({ userId: user1.id })
        .expect(httpStatus.FORBIDDEN);
    });
  });
});
```