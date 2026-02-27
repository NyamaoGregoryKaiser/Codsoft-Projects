```typescript
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Task } from '../src/tasks/entities/task.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/users/enums/user-role.enum';
import { TaskStatus } from '../src/tasks/enums/task-status.enum';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminUser: User;
  let user1: User; // Project owner & task creator
  let user2: User; // Task assignee, another user
  let adminAccessToken: string;
  let user1AccessToken: string;
  let user2AccessToken: string;
  let user1Project: Project;
  let user2Project: Project; // A project not owned by user1
  let user1Task: Task; // Task created by user1, assigned to user1
  let user1ProjectTaskAssignedToUser2: Task; // Task created by user1, assigned to user2

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    // Clean up all data and create fresh for tests
    const userRepository = dataSource.getRepository(User);
    const projectRepository = dataSource.getRepository(Project);
    const taskRepository = dataSource.getRepository(Task);
    await taskRepository.delete({});
    await projectRepository.delete({});
    await userRepository.delete({});

    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await userRepository.save({
      name: 'Admin User',
      email: 'admin_task_test@example.com',
      password: adminPassword,
      roles: [UserRole.Admin],
    });

    const user1Password = await bcrypt.hash('User1Password123!', 10);
    user1 = await userRepository.save({
      name: 'User One',
      email: 'user1_task_test@example.com',
      password: user1Password,
      roles: [UserRole.User],
    });

    const user2Password = await bcrypt.hash('User2Password123!', 10);
    user2 = await userRepository.save({
      name: 'User Two',
      email: 'user2_task_test@example.com',
      password: user2Password,
      roles: [UserRole.User],
    });

    // Get access tokens
    adminAccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: adminUser.email, password: 'AdminPassword123!' })).body.accessToken;
    user1AccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: user1.email, password: 'User1Password123!' })).body.accessToken;
    user2AccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: user2.email, password: 'User2Password123!' })).body.accessToken;

    // Create projects
    user1Project = await projectRepository.save({
      title: 'User1 Task Project',
      description: 'Project owned by user1 for tasks',
      owner: user1,
    });
    user2Project = await projectRepository.save({
      title: 'User2 Task Project',
      description: 'Project owned by user2 for tasks',
      owner: user2,
    });

    // Create tasks
    user1Task = await taskRepository.save({
      title: 'User1 Task A',
      description: 'Task for user1',
      project: user1Project,
      assignee: user1,
      creator: user1,
    });
    user1ProjectTaskAssignedToUser2 = await taskRepository.save({
      title: 'User1 Task B (Assigned to User2)',
      description: 'Task from user1 project, assigned to user2',
      project: user1Project,
      assignee: user2,
      creator: user1,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/tasks (POST)', () => {
    it('should allow project owner to create a new task', async () => {
      const newTask = {
        title: 'New Task by User1',
        projectId: user1Project.id,
        assigneeId: user1.id,
      };
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newTask)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.title).toEqual(newTask.title);
          expect(res.body.project.id).toEqual(newTask.projectId);
          expect(res.body.assignee.id).toEqual(newTask.assigneeId);
          expect(res.body.creator.id).toEqual(user1.id);
        });
    });

    it('should allow admin to create a new task in any project', async () => {
      const newTask = {
        title: 'New Task by Admin for User2 Project',
        projectId: user2Project.id,
        assigneeId: user2.id,
      };
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newTask)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.title).toEqual(newTask.title);
          expect(res.body.project.id).toEqual(newTask.projectId);
          expect(res.body.assignee.id).toEqual(newTask.assigneeId);
          expect(res.body.creator.id).toEqual(adminUser.id);
        });
    });

    it('should prevent a user from creating a task in a project they do not own', async () => {
      const newTask = {
        title: 'Forbidden Task',
        projectId: user2Project.id, // User1 doesn't own this project
        assigneeId: user1.id,
      };
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newTask)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this project.');
        });
    });

    it('should return 404 if project does not exist', async () => {
      const nonExistentProjectId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const newTask = {
        title: 'Task for non-existent project',
        projectId: nonExistentProjectId,
        assigneeId: user1.id,
      };
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newTask)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Project with ID "${nonExistentProjectId}" not found.`);
        });
    });
  });

  describe('/tasks (GET)', () => {
    it('should allow admin to get all tasks', async () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArray();
          expect(res.body.length).toBeGreaterThanOrEqual(3); // user1Task, user1ProjectTaskAssignedToUser2, and new task by admin
        });
    });

    it('should allow a project owner to get tasks for their project', async () => {
      return request(app.getHttpServer())
        .get(`/tasks?projectId=${user1Project.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArray();
          expect(res.body.every(t => t.project.id === user1Project.id)).toBeTrue();
          expect(res.body.length).toBeGreaterThanOrEqual(2); // user1Task, user1ProjectTaskAssignedToUser2
        });
    });

    it('should allow an admin to get tasks for any project', async () => {
      return request(app.getHttpServer())
        .get(`/tasks?projectId=${user2Project.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArray();
          expect(res.body.every(t => t.project.id === user2Project.id)).toBeTrue();
          expect(res.body.length).toBeGreaterThanOrEqual(1); // Task created by admin for user2 project
        });
    });

    it('should prevent a regular user from getting tasks for a project they do not own', async () => {
      return request(app.getHttpServer())
        .get(`/tasks?projectId=${user2Project.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to view tasks for this project.');
        });
    });

    it('should prevent a regular user from getting all tasks without a project filter', async () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Regular users must specify a projectId to view tasks.');
        });
    });
  });

  describe('/tasks/:id (GET)', () => {
    it('should allow task owner (project owner) to get their task by ID', async () => {
      return request(app.getHttpServer())
        .get(`/tasks/${user1Task.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(user1Task.id);
          expect(res.body.project.owner.id).toEqual(user1.id);
        });
    });

    it('should allow task assignee to get their assigned task by ID', async () => {
      return request(app.getHttpServer())
        .get(`/tasks/${user1ProjectTaskAssignedToUser2.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(user1ProjectTaskAssignedToUser2.id);
          expect(res.body.assignee.id).toEqual(user2.id);
        });
    });

    it('should allow admin to get any task by ID', async () => {
      return request(app.getHttpServer())
        .get(`/tasks/${user1Task.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(user1Task.id);
        });
    });

    it('should prevent a non-owner/non-assignee from getting a task', async () => {
      // User1 tries to access a task in User2's project (which user1 doesn't own/isn't assigned to)
      const taskInUser2Project = await dataSource.getRepository(Task).save({
        title: 'Task in User2 Project',
        project: user2Project,
        creator: user2,
      });

      return request(app.getHttpServer())
        .get(`/tasks/${taskInUser2Project.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this task.');
        });
    });

    it('should return 404 for a non-existent task ID', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      return request(app.getHttpServer())
        .get(`/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Task with ID "${nonExistentId}" not found.`);
        });
    });
  });

  describe('/tasks/:id (PATCH)', () => {
    let tempTask: Task;

    beforeEach(async () => {
      tempTask = await dataSource.getRepository(Task).save({
        title: `Temp Task ${Date.now()}`,
        project: user1Project,
        creator: user1,
        assignee: user1,
      });
    });

    it('should allow task owner (project owner) to update their task', async () => {
      const updateDto = { title: 'Updated Task by Owner', status: TaskStatus.InProgress };
      return request(app.getHttpServer())
        .patch(`/tasks/${tempTask.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.title).toEqual(updateDto.title);
          expect(res.body.status).toEqual(updateDto.status);
        });
    });

    it('should allow task assignee to update their assigned task', async () => {
      const updateDto = { status: TaskStatus.Done };
      return request(app.getHttpServer())
        .patch(`/tasks/${user1ProjectTaskAssignedToUser2.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.status).toEqual(updateDto.status);
        });
    });

    it('should allow admin to update any task', async () => {
      const updateDto = { title: 'Admin Updated Task', assigneeId: user1.id };
      return request(app.getHttpServer())
        .patch(`/tasks/${user1Task.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.title).toEqual(updateDto.title);
          expect(res.body.assignee.id).toEqual(user1.id);
        });
    });

    it('should prevent a non-owner/non-assignee from updating a task', async () => {
      const updateDto = { status: TaskStatus.Done };
      // User2 tries to update a task owned by user1 and not assigned to user2
      return request(app.getHttpServer())
        .patch(`/tasks/${user1Task.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this task.');
        });
    });
  });

  describe('/tasks/:id (DELETE)', () => {
    let taskToDelete: Task;

    beforeEach(async () => {
      taskToDelete = await dataSource.getRepository(Task).save({
        title: `Task to Delete ${Date.now()}`,
        project: user1Project,
        creator: user1,
        assignee: user1,
      });
    });

    it('should allow task owner (project owner) to delete their task', async () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should allow admin to delete any task', async () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should prevent a task assignee from deleting a task (assignee can update, not delete)', async () => {
      // User2 is assignee but not project owner
      return request(app.getHttpServer())
        .delete(`/tasks/${user1ProjectTaskAssignedToUser2.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this task.');
        });
    });

    it('should prevent a non-owner/non-assignee from deleting a task', async () => {
      const otherUser = await dataSource.getRepository(User).save({
        name: 'Other User',
        email: `other_user_delete_task_${Date.now()}@example.com`,
        password: await bcrypt.hash('OtherPassword123!', 10),
        roles: [UserRole.User],
      });
      const otherUserAccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: otherUser.email, password: 'OtherPassword123!' })).body.accessToken;

      return request(app.getHttpServer())
        .delete(`/tasks/${taskToDelete.id}`)
        .set('Authorization', `Bearer ${otherUserAccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this task.');
        });
    });

    it('should return 404 when trying to delete a non-existent task', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      return request(app.getHttpServer())
        .delete(`/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Task with ID "${nonExistentId}" not found.`);
        });
    });
  });
});
```