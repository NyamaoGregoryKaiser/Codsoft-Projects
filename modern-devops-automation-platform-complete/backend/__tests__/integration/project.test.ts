```typescript
import request from 'supertest';
import { StatusCodes } from 'http-status-codes';
import { AppDataSource } from '../../src/data-source'; // Import the main data source
import { User } from '../../src/entities/User';
import { Project } from '../../src/entities/Project';
import { signJwt } from '../../src/utils/jwt';
import app from '../../src/app';

let adminToken: string;
let normalUserToken: string;
let adminUser: User;
let normalUser: User;

describe('Project Integration Tests', () => {
  beforeAll(async () => {
    // Reinitialize the data source to use the test database configuration
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize(true);

    // Create users
    adminUser = AppDataSource.getRepository(User).create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password123',
    });
    normalUser = AppDataSource.getRepository(User).create({
      username: 'normaluser',
      email: 'user@example.com',
      password: 'password123',
    });
    await AppDataSource.getRepository(User).save([adminUser, normalUser]);

    adminToken = signJwt({ id: adminUser.id, email: adminUser.email, username: adminUser.username });
    normalUserToken = signJwt({ id: normalUser.id, email: normalUser.email, username: normalUser.username });
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  afterEach(async () => {
    await AppDataSource.getRepository(Project).delete({});
  });

  describe('POST /api/projects', () => {
    it('should create a new project for the authenticated user', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'This is a test project description.',
      };

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProject);

      expect(res.statusCode).toEqual(StatusCodes.CREATED);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toEqual(newProject.name);
      expect(res.body.description).toEqual(newProject.description);
      expect(res.body.owner.id).toEqual(adminUser.id);

      const createdProject = await AppDataSource.getRepository(Project).findOne({
        where: { id: res.body.id },
        relations: ['owner'],
      });
      expect(createdProject).toBeDefined();
      expect(createdProject?.name).toEqual(newProject.name);
      expect(createdProject?.owner.id).toEqual(adminUser.id);
    });

    it('should return 400 if project name is missing', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Description' });

      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(res.body).toHaveProperty('message');
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Project A' });

      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('GET /api/projects', () => {
    it('should return all projects for the authenticated user', async () => {
      const project1 = AppDataSource.getRepository(Project).create({
        name: 'Project 1',
        description: 'Desc 1',
        owner: adminUser,
      });
      const project2 = AppDataSource.getRepository(Project).create({
        name: 'Project 2',
        description: 'Desc 2',
        owner: adminUser,
      });
      const otherUserProject = AppDataSource.getRepository(Project).create({
        name: 'Other User Project',
        description: 'Other Desc',
        owner: normalUser,
      });
      await AppDataSource.getRepository(Project).save([project1, project2, otherUserProject]);

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toEqual(project1.name);
      expect(res.body[1].name).toEqual(project2.name);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.statusCode).toEqual(StatusCodes.UNAUTHORIZED);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return a specific project by ID if owned by user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Specific Project',
        description: 'Specific Desc',
        owner: adminUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body.id).toEqual(project.id);
      expect(res.body.name).toEqual(project.name);
    });

    it('should return 404 if project does not exist', async () => {
      const nonExistentId = '11111111-1111-4111-1111-111111111111'; // A valid UUID format, but non-existent
      const res = await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });

    it('should return 403 if project is not owned by the user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Other User Project',
        description: 'Owned by normal user',
        owner: normalUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update a project if owned by the user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Project to Update',
        description: 'Initial description',
        owner: adminUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const updatedData = {
        name: 'Updated Project Name',
        description: 'New description.',
      };

      const res = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updatedData);

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body.name).toEqual(updatedData.name);
      expect(res.body.description).toEqual(updatedData.description);

      const updatedProject = await AppDataSource.getRepository(Project).findOneBy({ id: project.id });
      expect(updatedProject?.name).toEqual(updatedData.name);
    });

    it('should return 403 if project is not owned by the user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Other User Project',
        description: 'Owned by normal user',
        owner: normalUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Attempted Update' });

      expect(res.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });

    it('should return 400 if validation fails', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Project to Update',
        description: 'Initial description',
        owner: adminUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .put(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' }); // Invalid name

      expect(res.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete a project if owned by the user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Project to Delete',
        description: 'Delete this one',
        owner: adminUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.OK);
      expect(res.body).toEqual({ message: 'Project deleted successfully' });

      const deletedProject = await AppDataSource.getRepository(Project).findOneBy({ id: project.id });
      expect(deletedProject).toBeNull();
    });

    it('should return 403 if project is not owned by the user', async () => {
      const project = AppDataSource.getRepository(Project).create({
        name: 'Other User Project',
        description: 'Owned by normal user',
        owner: normalUser,
      });
      await AppDataSource.getRepository(Project).save(project);

      const res = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.FORBIDDEN);
    });

    it('should return 404 if project does not exist', async () => {
      const nonExistentId = '22222222-2222-4222-2222-222222222222';
      const res = await request(app)
        .delete(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(StatusCodes.NOT_FOUND);
    });
  });
});
```