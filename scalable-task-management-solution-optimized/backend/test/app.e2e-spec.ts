import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../src/auth/auth.module';
import { UsersModule } from '../src/users/users.module';
import { ProjectsModule } from '../src/projects/projects.module';
import { TasksModule } from '../src/tasks/tasks.module';
import { AppLoggerModule } from '../src/shared/logger/app-logger.module';
import { ConfigModule } from '@nestjs/config';
import { User } from '../src/users/entities/user.entity';
import { Project } from '../src/projects/entities/project.entity';
import { Task } from '../src/tasks/entities/task.entity';
import { Comment } from '../src/comments/entities/comment.entity';
import { Tag } from '../src/tags/entities/tag.entity';
import { TaskStatus } from '../src/shared/enums/task-status.enum';
import { Role } from '../src/shared/enums/roles.enum';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  let testUser: User;
  let testProject: Project;
  let testTask: Task;
  let adminToken: string;
  let userToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test', // Use a separate test .env file
        }),
        TypeOrmModule.forRoot({
          type: 'sqlite', // Use sqlite for faster in-memory tests
          database: ':memory:',
          entities: [User, Project, Task, Comment, Tag],
          synchronize: true, // Auto-create schema for tests
          logging: false,
        }),
        AuthModule,
        UsersModule,
        ProjectsModule,
        TasksModule,
        AppLoggerModule,
        ThrottlerModule.forRoot({
          ttl: 60,
          limit: 100,
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: 5, // Cache for 5 seconds for tests
        }),
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Seed test data
    const usersRepository = app.get('UserRepository'); // Get repository for User entity
    const projectsRepository = app.get('ProjectRepository');
    const tasksRepository = app.get('TaskRepository');

    // Create an admin user
    const adminPassword = await bcrypt.hash('adminpass', 10);
    const adminUser = usersRepository.create({
      username: 'testadmin',
      email: 'admin@test.com',
      password: adminPassword,
      roles: [Role.Admin],
    });
    await usersRepository.save(adminUser);
    adminToken = jwtService.sign({ sub: adminUser.id, username: adminUser.username, roles: adminUser.roles });

    // Create a regular user
    const userPassword = await bcrypt.hash('userpass', 10);
    testUser = usersRepository.create({
      username: 'testuser',
      email: 'user@test.com',
      password: userPassword,
      roles: [Role.User],
    });
    await usersRepository.save(testUser);
    userToken = jwtService.sign({ sub: testUser.id, username: testUser.username, roles: testUser.roles });

    // Create a project for the test user
    testProject = projectsRepository.create({
      name: 'Test Project',
      description: 'Description for test project',
      ownerId: testUser.id,
      owner: testUser,
    });
    await projectsRepository.save(testProject);

    // Create a task for the test project
    testTask = tasksRepository.create({
      title: 'Test Task',
      description: 'Description for test task',
      status: TaskStatus.TODO,
      projectId: testProject.id,
      project: testProject,
      assigneeId: testUser.id,
      assignee: testUser,
    });
    await tasksRepository.save(testTask);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Auth Flow', () => {
    it('/auth/register (POST) should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'newuser', email: 'new@test.com', password: 'newpassword123' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('new@test.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('/auth/login (POST) should login a user and return an access token', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'userpass' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(typeof res.body.accessToken).toBe('string');
        });
    });

    it('/auth/login (POST) should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' })
        .expect(401);
    });
  });

  describe('Projects (Authenticated)', () => {
    it('/projects (POST) should create a new project for the authenticated user', () => {
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Another Project', description: 'Description' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.name).toBe('Another Project');
          expect(res.body.ownerId).toBe(testUser.id);
        });
    });

    it('/projects (GET) should return projects for the authenticated user', () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(1);
          expect(res.body[0].ownerId).toBe(testUser.id);
        });
    });

    it('/projects/:id (GET) should return a specific project for the authenticated user', () => {
      return request(app.getHttpServer())
        .get(`/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(testProject.id);
          expect(res.body.name).toBe(testProject.name);
        });
    });

    it('/projects/:id (PATCH) should update a specific project', () => {
      return request(app.getHttpServer())
        .patch(`/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Test Project', isCompleted: true })
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe('Updated Test Project');
          expect(res.body.isCompleted).toBe(true);
        });
    });

    it('/projects/:id (DELETE) should delete a specific project', async () => {
      const tempProject = await request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Project to Delete', description: 'Temp' })
        .expect(201)
        .then(res => res.body);

      return request(app.getHttpServer())
        .delete(`/projects/${tempProject.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('successfully deleted');
        });
    });
  });

  // Example for tasks
  describe('Tasks (Authenticated)', () => {
    it('/tasks (POST) should create a new task within an owned project', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'New Task for Project',
          projectId: testProject.id,
          description: 'This is a new task',
          status: TaskStatus.TODO,
          assigneeId: testUser.id,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('New Task for Project');
          expect(res.body.projectId).toBe(testProject.id);
          expect(res.body.assigneeId).toBe(testUser.id);
        });
    });

    it('/tasks (GET) should retrieve tasks for the authenticated user and their projects', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.some(task => task.id === testTask.id)).toBe(true);
        });
    });
  });

  // Example for Admin-only route
  describe('Users (Admin-only)', () => {
    it('/users (GET) should allow admin to view all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2); // admin, testuser, newuser
        });
    });

    it('/users (GET) should forbid regular user from viewing all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403); // Forbidden
    });
  });

  // Performance Test Hint:
  // For actual performance tests, you'd use tools like k6, JMeter, or Artillery,
  // pointing them at your deployed API endpoints.
  // This `supertest` E2E test only confirms basic functionality under load.
  it('should handle multiple requests within rate limit', async () => {
    const agent = request(app.getHttpServer());
    const requests = Array(10).fill(0).map(() =>
      agent.get('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)
    );
    await Promise.all(requests);
  });

  it('should apply rate limiting and return 429 after exceeding limit', async () => {
    // For this test to pass consistently, throttler limits in app.module.ts need to be very low,
    // or you need to simulate many requests quickly.
    // In actual production, rate limits are higher.
    // Let's assume a very low limit for this test setup (e.g., 2 requests per 60s for testing)

    // Make enough requests to exceed the configured limit (e.g., 2 requests + 1 for 429)
    const agent = request(app.getHttpServer());
    const limit = 3; // Set a small limit for test purposes, if Throttler is configured low

    // Make requests to a throttled endpoint (e.g., projects)
    for (let i = 0; i < limit - 1; i++) {
      await agent.get('/projects')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
    }

    // The next request should be throttled
    await agent.get('/projects')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(429);
  }, 15000); // Increase timeout for this test as it might take longer
});