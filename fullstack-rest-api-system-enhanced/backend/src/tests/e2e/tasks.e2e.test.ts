import request from 'supertest';
import app from '../../app';
import { AppDataSource } from '../../database';
import { User, UserRole } from '../../database/entities/User';
import { Task, TaskPriority, TaskStatus } from '../../database/entities/Task';
import { redisClient } from '../../shared/utils/cache';

describe('Tasks E2E Tests', () => {
  let adminUser: User;
  let adminToken: string;
  let regularUser: User;
  let regularUserToken: string;

  beforeEach(async () => {
    await AppDataSource.getRepository(Task).clear();
    await AppDataSource.getRepository(User).clear();
    await redisClient.del('*'); // Clear Redis cache before each test

    // Register admin user
    const adminRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Admin',
        lastName: 'Test',
        email: 'admin_e2e_tasks@example.com',
        password: 'password123',
      });
    adminUser = adminRegisterRes.body.user;
    adminToken = adminRegisterRes.body.token;
    await AppDataSource.getRepository(User).update(adminUser.id, { role: UserRole.ADMIN });
    adminUser.role = UserRole.ADMIN;

    // Register regular user
    const userRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        firstName: 'Regular',
        lastName: 'User',
        email: 'user_e2e_tasks@example.com',
        password: 'password123',
      });
    regularUser = userRegisterRes.body.user;
    regularUserToken = userRegisterRes.body.token;
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a task by authenticated user and assign to self by default', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          title: 'My First Task',
          description: 'Description for my first task.',
          priority: TaskPriority.HIGH,
          dueDate: new Date().toISOString(),
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.title).toEqual('My First Task');
      expect(res.body.assignee.id).toEqual(regularUser.id);
      expect(res.body.status).toEqual(TaskStatus.PENDING); // Default status
    });

    it('should allow admin to create a task and assign to another user', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Assigned Task',
          description: 'This task is assigned by admin to a regular user.',
          assigneeId: regularUser.id,
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.title).toEqual('Admin Assigned Task');
      expect(res.body.assignee.id).toEqual(regularUser.id);
    });

    it('should return 400 for invalid task data', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '', // Empty title
          status: 'INVALID_STATUS', // Invalid status
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Title is required');
      expect(res.body.message).toContain('Invalid task status');
    });

    it('should return 403 if non-admin tries to assign task to another user', async () => {
      const res = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          title: 'Attempt to assign',
          assigneeId: adminUser.id,
        });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('You can only assign tasks to yourself.');
    });
  });

  describe('GET /api/v1/tasks', () => {
    let task1: Task, task2: Task;
    beforeEach(async () => {
      task1 = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Task for Admin',
          assigneeId: adminUser.id,
          status: TaskStatus.PENDING
        })).body;

      task2 = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Task for Regular User',
          assigneeId: regularUser.id,
          status: TaskStatus.IN_PROGRESS
        })).body;
    });

    it('should return all tasks for an admin user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks).toHaveLength(2);
      expect(res.body.total).toEqual(2);
      expect(res.body.tasks.some((t: Task) => t.id === task1.id)).toBe(true);
      expect(res.body.tasks.some((t: Task) => t.id === task2.id)).toBe(true);
    });

    it('should return only tasks assigned to regular user', async () => {
      const res = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.total).toEqual(1);
      expect(res.body.tasks[0].id).toEqual(task2.id);
      expect(res.body.tasks[0].assignee.id).toEqual(regularUser.id);
    });

    it('should filter tasks by status for admin', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks?status=${TaskStatus.PENDING}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.tasks).toHaveLength(1);
      expect(res.body.tasks[0].id).toEqual(task1.id);
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .get('/api/v1/tasks');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/v1/tasks/:id', () => {
    let task: Task;
    beforeEach(async () => {
      task = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Specific Task',
          assigneeId: regularUser.id,
        })).body;
    });

    it('should return a task by ID for the assignee', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(task.id);
      expect(res.body.assignee.id).toEqual(regularUser.id);
    });

    it('should return a task by ID for an admin', async () => {
      const res = await request(app)
        .get(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(task.id);
      expect(res.body.assignee.id).toEqual(regularUser.id);
    });

    it('should return 404 for a non-existent task', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/some-non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toContain('Task with ID some-non-existent-uuid not found');
    });

    it('should return 403 if user tries to access another user\'s task', async () => {
      const anotherUserRes = await request(app)
        .post('/api/v1/auth/register')
        .send({
          firstName: 'Another',
          lastName: 'User',
          email: 'another.user@example.com',
          password: 'password123',
        });
      const anotherUserToken = anotherUserRes.body.token;

      const res = await request(app)
        .get(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('You are not authorized to view this task.');
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let task: Task;
    beforeEach(async () => {
      task = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Task to Update',
          assigneeId: regularUser.id,
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
        })).body;
    });

    it('should allow assignee to update their own task status and priority', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(task.id);
      expect(res.body.status).toEqual(TaskStatus.COMPLETED);
      expect(res.body.priority).toEqual(TaskPriority.MEDIUM);
    });

    it('should allow admin to update any task including assignee', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated by Admin',
          assigneeId: adminUser.id,
          status: TaskStatus.IN_PROGRESS,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toEqual('Updated by Admin');
      expect(res.body.assignee.id).toEqual(adminUser.id);
      expect(res.body.status).toEqual(TaskStatus.IN_PROGRESS);
    });

    it('should return 403 if non-admin tries to update another user\'s task', async () => {
      const anotherUserRes = await request(app)
        .post('/api/v1/auth/register')
        .send({ firstName: 'Another', lastName: 'User', email: 'another_user_update@example.com', password: 'password123' });
      const anotherUserToken = anotherUserRes.body.token;

      const res = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${anotherUserToken}`)
        .send({ title: 'Forbidden Update' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('You are not authorized to update this task.');
    });

    it('should return 403 if non-admin tries to change assignee', async () => {
      const res = await request(app)
        .put(`/api/v1/tasks/${task.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ assigneeId: adminUser.id });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('You cannot change the assignee of a task.');
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskToDeleteByAssignee: Task;
    let taskToDeleteByAdmin: Task;
    let anotherUserTask: Task;

    beforeEach(async () => {
      taskToDeleteByAssignee = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({ title: 'Delete My Task' })).body;

      taskToDeleteByAdmin = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Delete Any Task', assigneeId: regularUser.id })).body;

      anotherUserTask = (await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Another Users Task', assigneeId: adminUser.id })).body;
    });

    it('should allow assignee to delete their own task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskToDeleteByAssignee.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toEqual(204);

      const checkRes = await request(app)
        .get(`/api/v1/tasks/${taskToDeleteByAssignee.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);
      expect(checkRes.statusCode).toEqual(404); // Task should be soft-deleted
    });

    it('should allow admin to delete any task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${taskToDeleteByAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);

      const checkRes = await request(app)
        .get(`/api/v1/tasks/${taskToDeleteByAdmin.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.statusCode).toEqual(404);
    });

    it('should return 403 if user tries to delete another user\'s task', async () => {
      const res = await request(app)
        .delete(`/api/v1/tasks/${anotherUserTask.id}`)
        .set('Authorization', `Bearer ${regularUserToken}`);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('You are not authorized to delete this task.');
    });

    it('should return 404 for deleting a non-existent task', async () => {
      const res = await request(app)
        .delete('/api/v1/tasks/some-non-existent-uuid')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toContain('Task with ID some-non-existent-uuid not found');
    });
  });
});