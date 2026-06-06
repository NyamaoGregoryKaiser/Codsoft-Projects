```javascript
const httpStatus = require('http-status');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const projectService = require('../../src/modules/projects/project.service');
const taskService = require('../../src/modules/tasks/task.service');
const ApiError = require('../../src/utils/ApiError');

// Test users and project
let adminUser;
let regularUser;
let testProject;
let secondUser; // For assigning tasks

// Clean up database after each test
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeEach(async () => {
  await cleanUpDb();
  adminUser = await userService.createUser({ name: 'Admin User', email: 'admin@example.com', password: 'Password123!', role: 'ADMIN' });
  regularUser = await userService.createUser({ name: 'Regular User', email: 'user@example.com', password: 'Password123!', role: 'USER' });
  secondUser = await userService.createUser({ name: 'Second User', email: 'second@example.com', password: 'Password123!', role: 'USER' });
  testProject = await projectService.createProject({ name: 'Test Project', description: 'Project for tasks' }, regularUser.id);
});

afterAll(async () => {
  await cleanUpDb();
  await prisma.$disconnect();
});

describe('Task Service - Integration Tests', () => {
  describe('createTask', () => {
    it('should successfully create a new task', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Description of the task',
        projectId: testProject.id,
        assignedToId: secondUser.id,
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date(),
      };

      const task = await taskService.createTask(taskData);

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.projectId).toBe(testProject.id);
      expect(task.assignedToId).toBe(secondUser.id);
      expect(task.status).toBe(taskData.status);
      expect(task.priority).toBe(taskData.priority);
      expect(task.dueDate).toEqual(taskData.dueDate);
    });

    it('should create a task without assigned user', async () => {
      const taskData = {
        title: 'Unassigned Task',
        projectId: testProject.id,
        status: 'TODO',
        priority: 'MEDIUM',
      };

      const task = await taskService.createTask(taskData);
      expect(task.assignedToId).toBeNull();
    });
  });

  describe('queryTasks', () => {
    let task1, task2, task3;

    beforeEach(async () => {
      task1 = await taskService.createTask({
        title: 'Task Alpha',
        projectId: testProject.id,
        assignedToId: regularUser.id,
        status: 'TODO',
        priority: 'HIGH',
      });
      task2 = await taskService.createTask({
        title: 'Task Beta',
        projectId: testProject.id,
        assignedToId: secondUser.id,
        status: 'IN_PROGRESS',
        priority: 'MEDIUM',
      });
      task3 = await taskService.createTask({
        title: 'Task Gamma',
        projectId: testProject.id,
        assignedToId: regularUser.id,
        status: 'DONE',
        priority: 'LOW',
      });
    });

    it('should return all tasks for a project with default pagination/sorting', async () => {
      const result = await taskService.queryTasks({ projectId: testProject.id }, {});

      expect(result.results).toHaveLength(3);
      expect(result.totalResults).toBe(3);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.results.map((t) => t.title)).toEqual(expect.arrayContaining(['Task Alpha', 'Task Beta', 'Task Gamma']));
    });

    it('should filter tasks by title', async () => {
      const result = await taskService.queryTasks({ projectId: testProject.id, title: 'Alpha' }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Task Alpha');
    });

    it('should filter tasks by assignedToId', async () => {
      const result = await taskService.queryTasks({ projectId: testProject.id, assignedToId: secondUser.id }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Task Beta');
    });

    it('should filter tasks by status', async () => {
      const result = await taskService.queryTasks({ projectId: testProject.id, status: 'TODO' }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Task Alpha');
    });

    it('should filter tasks by priority', async () => {
      const result = await taskService.queryTasks({ projectId: testProject.id, priority: 'HIGH' }, {});
      expect(result.results).toHaveLength(1);
      expect(result.results[0].title).toBe('Task Alpha');
    });

    it('should apply pagination correctly', async () => {
      for (let i = 0; i < 15; i++) {
        await taskService.createTask({ title: `Extra Task ${i}`, projectId: testProject.id, status: 'TODO', priority: 'LOW' });
      }

      const resultPage1 = await taskService.queryTasks({ projectId: testProject.id }, { page: 1, limit: 10 });
      expect(resultPage1.results).toHaveLength(10);
      expect(resultPage1.totalResults).toBe(18); // 3 from beforeEach + 15 new
      expect(resultPage1.totalPages).toBe(2);

      const resultPage2 = await taskService.queryTasks({ projectId: testProject.id }, { page: 2, limit: 10 });
      expect(resultPage2.results).toHaveLength(8);
    });
  });

  describe('getTaskById', () => {
    it('should return a task by ID', async () => {
      const task = await taskService.createTask({ title: 'Test Get Task', projectId: testProject.id, status: 'TODO', priority: 'MEDIUM' });
      const fetchedTask = await taskService.getTaskById(task.id);

      expect(fetchedTask).toBeDefined();
      expect(fetchedTask.id).toBe(task.id);
      expect(fetchedTask.title).toBe(task.title);
      expect(fetchedTask.project.id).toBe(testProject.id);
      expect(fetchedTask.project.name).toBe(testProject.name);
    });

    it('should return null if task not found', async () => {
      const fetchedTask = await taskService.getTaskById('non-existent-id');
      expect(fetchedTask).toBeNull();
    });
  });

  describe('updateTaskById', () => {
    it('should update task title and status', async () => {
      const task = await taskService.createTask({ title: 'Old Title', projectId: testProject.id, status: 'TODO', priority: 'MEDIUM' });
      const updateBody = { title: 'New Title', status: 'IN_PROGRESS', assignedToId: secondUser.id };
      const updatedTask = await taskService.updateTaskById(task.id, updateBody);

      expect(updatedTask).toBeDefined();
      expect(updatedTask.id).toBe(task.id);
      expect(updatedTask.title).toBe('New Title');
      expect(updatedTask.status).toBe('IN_PROGRESS');
      expect(updatedTask.assignedToId).toBe(secondUser.id);

      const taskInDb = await prisma.task.findUnique({ where: { id: task.id } });
      expect(taskInDb.title).toBe('New Title');
      expect(taskInDb.status).toBe('IN_PROGRESS');
      expect(taskInDb.assignedToId).toBe(secondUser.id);
    });

    it('should throw ApiError (404) if task not found', async () => {
      await expect(taskService.updateTaskById('non-existent-id', { title: 'New Title' })).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Task not found')
      );
    });
  });

  describe('deleteTaskById', () => {
    it('should delete a task by ID', async () => {
      const task = await taskService.createTask({ title: 'Task to Delete', projectId: testProject.id, status: 'TODO', priority: 'MEDIUM' });
      await taskService.deleteTaskById(task.id);

      const fetchedTask = await prisma.task.findUnique({ where: { id: task.id } });
      expect(fetchedTask).toBeNull();
    });

    it('should throw ApiError (404) if task not found', async () => {
      await expect(taskService.deleteTaskById('non-existent-id')).rejects.toThrow(
        new ApiError(httpStatus.NOT_FOUND, 'Task not found')
      );
    });
  });
});
```