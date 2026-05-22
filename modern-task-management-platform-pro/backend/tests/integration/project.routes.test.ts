```typescript
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/database/data-source';
import { User, UserRole } from '../../src/database/entities/user.entity';
import { Project } from '../../src/database/entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from '../../src/modules/projects/project.dto';
import * as jwt from 'jsonwebtoken';
import { config } from '../../src/config/config';
import { redisClient } from '../../src/config/redis';

describe('Project Routes', () => {
  let adminUser: User;
  let memberUser: User;
  let adminToken: string;
  let memberToken: string;
  let testProject: Project;

  const userRepository = AppDataSource.getRepository(User);
  const projectRepository = AppDataSource.getRepository(Project);

  beforeAll(async () => {
    // Clear Redis mocks for API tests
    (redisClient.get as jest.Mock).mockClear();
    (redisClient.setex as jest.Mock).mockClear();
    (redisClient.del as jest.Mock).mockClear();

    // Ensure database is clean and initialized for tests
    await AppDataSource.synchronize(true); // Drops schema and recreates
    await AppDataSource.runMigrations(); // Run migrations after synchronize(true)

    // Create test users
    adminUser = userRepository.create({
      firstName: 'Admin', lastName: 'User', email: 'admin_project@test.com',
      password: 'password123', role: UserRole.ADMIN
    });
    await adminUser.hashPassword();
    await userRepository.save(adminUser);

    memberUser = userRepository.create({
      firstName: 'Member', lastName: 'User', email: 'member_project@test.com',
      password: 'password123', role: UserRole.MEMBER
    });
    await memberUser.hashPassword();
    await userRepository.save(memberUser);

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser.id }, config.jwt.secret, { expiresIn: '1h' });
    memberToken = jwt.sign({ id: memberUser.id }, config.jwt.secret, { expiresIn: '1h' });

    // Create a project for a member user to test permissions
    testProject = projectRepository.create({
      name: 'Test Project',
      description: 'A project for testing CRUD operations.',
      owner: memberUser,
    });
    await projectRepository.save(testProject);
  });

  afterAll(async () => {
    await AppDataSource.synchronize(true); // Clean up database after tests
    await AppDataSource.destroy();
  });

  // Clear database before each test to ensure isolation, except for users and base project
  beforeEach(async () => {
    await projectRepository.clear(); // Clear projects
    // Re-create testProject owned by memberUser
    testProject = projectRepository.create({
      name: 'Test Project',
      description: 'A project for testing CRUD operations.',
      owner: memberUser,
    });
    await projectRepository.save(testProject);
  });

  describe('POST /api/v1/projects', () => {
    const createDto: CreateProjectDto = {
      name: 'New Project',
      description: 'Description for the new project',
    };

    it('should create a new project for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(createDto);

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(createDto.name);
      expect(res.body.data.owner.id).toBe(memberUser.id);
      expect(redisClient.del).toHaveBeenCalledWith('cache:projects*'); // Invalidation check
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .send(createDto);

      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: '' }); // Empty name

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Project name is required');
    });
  });

  describe('GET /api/v1/projects', () => {
    it('should return all projects for an authenticated user (owner or assignee)', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].id).toBe(testProject.id);
      expect(redisClient.get).toHaveBeenCalledWith(`cache:user:${memberUser.id}:/api/v1/projects`);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .get('/api/v1/projects');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/v1/projects/:id', () => {
    it('should return a specific project if user is owner', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testProject.id);
      expect(res.body.data.name).toBe(testProject.name);
      expect(redisClient.get).toHaveBeenCalledWith(`cache:user:${memberUser.id}:/api/v1/projects/${testProject.id}`);
    });

    it('should return 403 if user is not the owner or assignee', async () => {
      // Admin is not owner or assignee of testProject
      const res = await request(app)
        .get(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if project not found', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const res = await request(app)
        .get(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('PATCH /api/v1/projects/:id', () => {
    const updateDto: UpdateProjectDto = {
      name: 'Updated Test Project',
      description: 'New description.',
    };

    it('should update a project if user is the owner', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateDto);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updateDto.name);
      expect(res.body.data.description).toBe(updateDto.description);
      expect(redisClient.del).toHaveBeenCalledWith('cache:projects*'); // Invalidation check
      expect(redisClient.del).toHaveBeenCalledWith(`cache:project*`); // Specific invalidation
    });

    it('should return 403 if user is not the owner', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateDto);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: '' }); // Empty name

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Project name is required');
    });
  });

  describe('DELETE /api/v1/projects/:id', () => {
    it('should delete a project if user is the owner', async () => {
      // Create a temporary project to delete
      const tempProject = projectRepository.create({
        name: 'Temp Project to Delete',
        owner: memberUser,
      });
      await projectRepository.save(tempProject);

      const res = await request(app)
        .delete(`/api/v1/projects/${tempProject.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeNull(); // 204 No Content typically returns null data
      expect(redisClient.del).toHaveBeenCalledWith('cache:projects*'); // Invalidation check
      expect(redisClient.del).toHaveBeenCalledWith(`cache:project*`); // Specific invalidation

      const deletedProject = await projectRepository.findOneBy({ id: tempProject.id });
      expect(deletedProject).toBeNull();
    });

    it('should return 403 if user is not the owner', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 if project not found', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const res = await request(app)
        .delete(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});
```