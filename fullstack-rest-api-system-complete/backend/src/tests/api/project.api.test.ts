import request from 'supertest';
import { AppDataSource } from '../../config/database';
import App from '../../app';
import { User, UserRole } from '../../models/User.entity';
import { Project } from '../../models/Project.entity';
import { seedDatabase } from '../../database/seeds';
import { config } from '../../config';
import logger from '../../utils/logger';
import { generateAccessToken } from '../../utils/jwt';
import redisClient from '../../config/redis';

// Use a separate test database
process.env.DB_NAME = process.env.DB_TEST_NAME || 'horizon_pms_test_db';
process.env.NODE_ENV = 'test';

let server: any;
let app: App;
let adminAccessToken: string;
let userAccessToken: string;
let adminUser: User;
let regularUser: User;
let testProject: Project;

describe('Project API E2E', () => {
  beforeAll(async () => {
    // Suppress logger output during tests
    logger.transports.forEach((t) => (t.silent = true));

    // Initialize database for tests
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    // Clear and seed data for a clean state
    await seedDatabase();

    // Fetch seeded users and generate tokens
    const userRepository = AppDataSource.getRepository(User);
    adminUser = (await userRepository.findOneBy({ email: 'admin@example.com' }))!;
    regularUser = (await userRepository.findOneBy({ email: 'john.doe@example.com' }))!;

    adminAccessToken = generateAccessToken({ id: adminUser.id, email: adminUser.email, role: adminUser.role });
    userAccessToken = generateAccessToken({ id: regularUser.id, email: regularUser.email, role: regularUser.role });

    // Fetch a seeded project for updates/deletes
    const projectRepository = AppDataSource.getRepository(Project);
    testProject = (await projectRepository.findOne({ relations: ['owner'], where: { name: 'Website Redesign' } }))!;


    // Clear Redis cache before tests
    await redisClient.flushdb();

    // Start the Express server
    app = new App();
    server = app.app.listen(config.port);
  });

  afterAll(async () => {
    // Clear test database
    await AppDataSource.dropDatabase();
    await AppDataSource.destroy();

    // Close Redis connection
    await redisClient.quit();

    // Close the server
    server.close();

    // Restore logger output
    logger.transports.forEach((t) => (t.silent = false));
  });

  describe('POST /api/projects', () => {
    it('should create a new project as a regular user', async () => {
      const res = await request(server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({
          name: 'New Project by User',
          description: 'User created project.',
          startDate: '2024-01-01',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual('New Project by User');
      expect(res.body.ownerId).toEqual(regularUser.id);

      // Verify cache clear happened
      expect(await redisClient.keys('/api/projects*')).toEqual([]);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(server)
        .post('/api/projects')
        .send({ name: 'Unauthorized Project' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('No token provided or invalid format.');
    });

    it('should return 400 for invalid project data', async () => {
      const res = await request(server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'ab', description: 123 }); // Invalid name length, invalid description type

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Project name must be at least 3 characters long');
    });
  });

  describe('GET /api/projects', () => {
    it('should retrieve all projects for an authenticated user', async () => {
      const res = await request(server)
        .get('/api/projects')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('owner');
      expect(res.body[0].owner).not.toHaveProperty('password'); // Ensure password is not exposed

      // Check if data is cached
      const cached = await redisClient.get('/api/projects');
      expect(cached).toBeDefined();
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(server)
        .get('/api/projects');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should retrieve a single project by ID', async () => {
      const res = await request(server)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('id', testProject.id);
      expect(res.body).toHaveProperty('name', testProject.name);
      expect(res.body).toHaveProperty('tasks');
      expect(res.body.owner).not.toHaveProperty('password');

      // Check if data is cached
      const cached = await redisClient.get(`/api/projects/${testProject.id}`);
      expect(cached).toBeDefined();
    });

    it('should return 404 for a non-existent project ID', async () => {
      const res = await request(server)
        .get('/api/projects/non-existent-uuid')
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Project with ID non-existent-uuid not found.');
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project as its owner', async () => {
      const newName = 'Updated Website Redesign';
      const res = await request(server)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`) // adminUser is owner of testProject
        .send({ name: newName });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('name', newName);

      // Verify cache clear happened
      expect(await redisClient.keys(`/api/projects/${testProject.id}`)).toEqual([]);
      expect(await redisClient.keys('/api/projects*')).toEqual([]);
    });

    it('should return 403 if not the project owner or admin', async () => {
      const res = await request(server)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`) // regularUser is not owner
        .send({ name: 'Attempted Update' });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden: You do not have permission to update this project.');
    });

    it('should allow admin to change project owner', async () => {
      const projectOwnedByUser = (await AppDataSource.getRepository(Project).findOne({ where: { ownerId: regularUser.id } }))!;

      const res = await request(server)
        .put(`/api/projects/${projectOwnedByUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`) // Admin user
        .send({ ownerId: adminUser.id }); // Change owner to adminUser

      expect(res.statusCode).toEqual(200);
      expect(res.body.ownerId).toEqual(adminUser.id);
    });

    it('should return 403 if non-admin tries to change project owner', async () => {
      const projectOwnedByAdmin = (await AppDataSource.getRepository(Project).findOne({ where: { ownerId: adminUser.id } }))!;
      const res = await request(server)
        .put(`/api/projects/${projectOwnedByAdmin.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`) // Regular user
        .send({ ownerId: regularUser.id });

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden: Only administrators can change project ownership.');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project as its owner', async () => {
      // Create a temporary project to delete
      const tempProject = await request(server)
        .post('/api/projects')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send({ name: 'Temp Project for Deletion', description: 'Will be deleted.' });

      const res = await request(server)
        .delete(`/api/projects/${tempProject.body.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`);

      expect(res.statusCode).toEqual(204);

      // Verify it's deleted
      const checkRes = await request(server)
        .get(`/api/projects/${tempProject.body.id}`)
        .set('Authorization', `Bearer ${userAccessToken}`);
      expect(checkRes.statusCode).toEqual(404);

      // Verify cache clear happened
      expect(await redisClient.keys(`/api/projects/${tempProject.body.id}`)).toEqual([]);
      expect(await redisClient.keys('/api/projects*')).toEqual([]);
    });

    it('should return 403 if not the project owner or admin', async () => {
      const res = await request(server)
        .delete(`/api/projects/${testProject.id}`) // testProject is owned by admin
        .set('Authorization', `Bearer ${userAccessToken}`); // Regular user

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toEqual('Forbidden: You do not have permission to delete this project.');
    });

    it('should return 404 for a non-existent project ID', async () => {
      const res = await request(server)
        .delete('/api/projects/non-existent-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toEqual('Project with ID non-existent-uuid not found.');
    });
  });
});