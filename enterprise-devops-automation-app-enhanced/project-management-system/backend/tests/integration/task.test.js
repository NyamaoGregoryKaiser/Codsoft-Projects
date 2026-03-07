```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { sequelize, User, Project, Task, Comment } = require('../../src/models');
const { generateAuthTokens } = require('../../src/utils/jwt');
const { v4: uuidv4 } = require('uuid');
const setupTestDB = require('../utils/setupTestDB');

setupTestDB();

describe('Task routes', () => {
  let user1, user2, admin;
  let user1AccessToken, user2AccessToken, adminAccessToken;
  let project1, project2;
  let task1, task2;

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

    task1 = await Task.create({
      id: uuidv4(),
      projectId: project1.id,
      title: 'Task for User1 Project',
      description: 'Description for task 1',
      assignedTo: user1.id,
      status: 'todo',
      priority: 'high',
    });

    task2 = await Task.create({
      id: uuidv4(),
      projectId: project1.id,
      title: 'Task for User2 (in Project1)',
      description: 'Description for task 2',
      assignedTo: user2.id,
      status: 'in-progress',
      priority: 'medium',
    });
  });

  describe('POST /api/tasks', () => {
    test('should return 201 and create a task if user is project owner', async () => {
      const newTask = {
        projectId: project1.id,
        title: 'New Task by Owner',
        description: 'Details for new task',
        assignedTo: user2.id,
        status: 'todo',
        priority: 'low',
      };
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newTask)
        .expect(httpStatus.CREATED);

      expect(res.body.title).toEqual(newTask.title);
      expect(res.body.projectId).toEqual(project1.id);
      expect(res.body.assignedTo).toEqual(user2.id);

      const dbTask = await Task.findByPk(res.body.id);
      expect(dbTask).toBeDefined();
      expect(dbTask.title).toEqual(newTask.title);
    });

    test('should return 201 and create a task if user is project member', async () => {
      const newTask = {
        projectId: project1.id,
        title: 'New Task by Member',
        description: 'Details for new task by member',
        assignedTo: user1.id,
        status: 'todo',
        priority: 'low',
      };
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member of project1
        .send(newTask)
        .expect(httpStatus.CREATED);

      expect(res.body.title).toEqual(newTask.title);
      expect(res.body.projectId).toEqual(project1.id);
      expect(res.body.assignedTo).toEqual(user1.id);
    });

    test('should return 403 if user is not project owner or member', async () => {
      const user3 = await User.create({ id: uuidv4(), name: 'User 3', email: 'user3@example.com', password: 'password123', role: 'user' });
      const user3AccessToken = generateAuthTokens(user3).access.token;

      const newTask = {
        projectId: project1.id,
        title: 'Forbidden Task',
        description: 'Should not be created',
      };
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user3AccessToken}`)
        .send(newTask)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 if assignedTo user is not a project member/owner', async () => {
      const userNotInProject = await User.create({ id: uuidv4(), name: 'Stranger', email: 'stranger@example.com', password: 'password123', role: 'user' });
      const newTask = {
        projectId: project1.id,
        title: 'Task with invalid assignee',
        assignedTo: userNotInProject.id,
        status: 'todo',
      };
      await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newTask)
        .expect(httpStatus.BAD_REQUEST); // Expected to fail due to assignee not being a member/owner
    });
  });

  describe('GET /api/tasks/:taskId', () => {
    test('should return 200 and task if user is project owner', async () => {
      const res = await request(app)
        .get(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(task1.id);
      expect(res.body.project.id).toEqual(project1.id);
    });

    test('should return 200 and task if user is project member', async () => {
      const res = await request(app)
        .get(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member of project1
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(task1.id);
      expect(res.body.project.id).toEqual(project1.id);
    });

    test('should return 403 if user is not project owner or member', async () => {
      const user3 = await User.create({ id: uuidv4(), name: 'User 3', email: 'user3@example.com', password: 'password123', role: 'user' });
      const user3AccessToken = generateAuthTokens(user3).access.token;

      await request(app)
        .get(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user3AccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if task not found', async () => {
      await request(app)
        .get(`/api/tasks/${uuidv4()}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/tasks/:taskId', () => {
    test('should return 200 and update task if user is project owner', async () => {
      const updateBody = { status: 'done' };
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(task1.id);
      expect(res.body.status).toEqual('done');
    });

    test('should return 200 and update task if user is project member', async () => {
      const updateBody = { status: 'done', description: 'Updated by member' };
      const res = await request(app)
        .patch(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member of project1
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toEqual(task1.id);
      expect(res.body.status).toEqual('done');
      expect(res.body.description).toEqual('Updated by member');
    });

    test('should return 403 if user is not project owner or member', async () => {
      const user3 = await User.create({ id: uuidv4(), name: 'User 3', email: 'user3@example.com', password: 'password123', role: 'user' });
      const user3AccessToken = generateAuthTokens(user3).access.token;

      await request(app)
        .patch(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user3AccessToken}`)
        .send({ status: 'done' })
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 400 if assignedTo user is not a project member/owner', async () => {
      const userNotInProject = await User.create({ id: uuidv4(), name: 'Stranger', email: 'stranger@example.com', password: 'password123', role: 'user' });
      const updateBody = { assignedTo: userNotInProject.id };
      await request(app)
        .patch(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateBody)
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /api/tasks/:taskId', () => {
    test('should return 204 if user is project owner', async () => {
      await request(app)
        .delete(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTask = await Task.findByPk(task1.id);
      expect(dbTask).toBeNull();
    });

    test('should return 204 if user is admin', async () => {
      await request(app)
        .delete(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const dbTask = await Task.findByPk(task1.id);
      expect(dbTask).toBeNull();
    });

    test('should return 403 if user is project member but not owner or admin', async () => {
      await request(app)
        .delete(`/api/tasks/${task1.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`) // User2 is member of project1
        .expect(httpStatus.FORBIDDEN);
    });

    test('should return 404 if task not found', async () => {
      await request(app)
        .delete(`/api/tasks/${uuidv4()}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
```