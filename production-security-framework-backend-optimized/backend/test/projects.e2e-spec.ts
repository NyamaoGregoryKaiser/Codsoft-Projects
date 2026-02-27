```typescript
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Project } from '../src/projects/entities/project.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('ProjectsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminUser: User;
  let user1: User; // Project owner
  let user2: User; // Another regular user
  let adminAccessToken: string;
  let user1AccessToken: string;
  let user2AccessToken: string;
  let user1Project: Project;
  let user2Project: Project;

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
    await projectRepository.delete({});
    await userRepository.delete({});

    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await userRepository.save({
      name: 'Admin User',
      email: 'admin_project_test@example.com',
      password: adminPassword,
      roles: [UserRole.Admin],
    });

    const user1Password = await bcrypt.hash('User1Password123!', 10);
    user1 = await userRepository.save({
      name: 'User One',
      email: 'user1_project_test@example.com',
      password: user1Password,
      roles: [UserRole.User],
    });

    const user2Password = await bcrypt.hash('User2Password123!', 10);
    user2 = await userRepository.save({
      name: 'User Two',
      email: 'user2_project_test@example.com',
      password: user2Password,
      roles: [UserRole.User],
    });

    // Get access tokens
    adminAccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: adminUser.email, password: 'AdminPassword123!' })).body.accessToken;
    user1AccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: user1.email, password: 'User1Password123!' })).body.accessToken;
    user2AccessToken = (await request(app.getHttpServer()).post('/auth/login').send({ email: user2.email, password: 'User2Password123!' })).body.accessToken;

    // Create initial projects for users
    user1Project = await projectRepository.save({
      title: 'User1 Project Alpha',
      description: 'Project owned by user1',
      owner: user1,
    });
    user2Project = await projectRepository.save({
      title: 'User2 Project Beta',
      description: 'Project owned by user2',
      owner: user2,
    });
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/projects (POST)', () => {
    it('should allow a regular user to create a project', async () => {
      const newProject = { title: 'New Project by User1', description: 'Description' };
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(newProject)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.title).toEqual(newProject.title);
          expect(res.body.owner.id).toEqual(user1.id);
        });
    });

    it('should allow admin to create a project', async () => {
      const newProject = { title: 'New Project by Admin', description: 'Admin Description' };
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newProject)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.title).toEqual(newProject.title);
          expect(res.body.owner.id).toEqual(adminUser.id);
        });
    });

    it('should prevent creating a project with the same title for the same owner', async () => {
      const duplicateProject = { title: 'User1 Project Alpha', description: 'Duplicate attempt' };
      return request(app.getHttpServer())
        .post('/projects')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(duplicateProject)
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body.message).toEqual(`Project with title "${duplicateProject.title}" already exists for this user.`);
        });
    });

    it('should require authentication to create a project', () => {
      const newProject = { title: 'Project without Auth', description: 'No auth' };
      return request(app.getHttpServer())
        .post('/projects')
        .send(newProject)
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/projects (GET)', () => {
    it('should allow admin to get all projects', async () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArray();
          expect(res.body.length).toBeGreaterThanOrEqual(3); // user1Project, user2Project, and the one created by admin in POST test
        });
    });

    it('should allow user1 to get only their projects', async () => {
      return request(app.getHttpServer())
        .get('/projects')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArray();
          expect(res.body.every(p => p.owner.id === user1.id)).toBeTrue();
          expect(res.body.length).toBeGreaterThanOrEqual(1); // At least user1ProjectAlpha and the one created in POST test
        });
    });

    it('should require authentication to get projects', () => {
      return request(app.getHttpServer())
        .get('/projects')
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('/projects/:id (GET)', () => {
    it('should allow project owner to get their project by ID', async () => {
      return request(app.getHttpServer())
        .get(`/projects/${user1Project.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(user1Project.id);
          expect(res.body.owner.id).toEqual(user1.id);
        });
    });

    it('should allow admin to get any project by ID', async () => {
      return request(app.getHttpServer())
        .get(`/projects/${user2Project.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(user2Project.id);
          expect(res.body.owner.id).toEqual(user2.id);
        });
    });

    it('should prevent another user from getting a project they do not own', async () => {
      return request(app.getHttpServer())
        .get(`/projects/${user1Project.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this project.');
        });
    });

    it('should return 404 for a non-existent project ID', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      return request(app.getHttpServer())
        .get(`/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Project with ID "${nonExistentId}" not found.`);
        });
    });
  });

  describe('/projects/:id (PATCH)', () => {
    it('should allow project owner to update their project', async () => {
      const updateDto = { title: 'Updated Project by User1', description: 'New description' };
      return request(app.getHttpServer())
        .patch(`/projects/${user1Project.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.title).toEqual(updateDto.title);
          expect(res.body.description).toEqual(updateDto.description);
        });
    });

    it('should allow admin to update any project', async () => {
      const updateDto = { title: 'Updated Project by Admin', description: 'Admin new description' };
      return request(app.getHttpServer())
        .patch(`/projects/${user2Project.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.title).toEqual(updateDto.title);
          expect(res.body.description).toEqual(updateDto.description);
        });
    });

    it('should prevent another user from updating a project they do not own', async () => {
      const updateDto = { title: 'Attempted Update' };
      return request(app.getHttpServer())
        .patch(`/projects/${user1Project.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this project.');
        });
    });

    it('should return 404 for updating a non-existent project', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const updateDto = { title: 'Non Existent' };
      return request(app.getHttpServer())
        .patch(`/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Project with ID "${nonExistentId}" not found.`);
        });
    });
  });

  describe('/projects/:id (DELETE)', () => {
    let projectToDelete: Project;

    beforeEach(async () => {
      const projectRepository = dataSource.getRepository(Project);
      projectToDelete = await projectRepository.save({
        title: `Project to Delete ${Date.now()}`,
        description: 'Temporary project for deletion test',
        owner: user1,
      });
    });

    it('should allow project owner to delete their project', async () => {
      return request(app.getHttpServer())
        .delete(`/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should allow admin to delete any project', async () => {
      return request(app.getHttpServer())
        .delete(`/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should prevent another user from deleting a project they do not own', async () => {
      return request(app.getHttpServer())
        .delete(`/projects/${projectToDelete.id}`)
        .set('Authorization', `Bearer ${user2AccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('You do not have permission to access this project.');
        });
    });

    it('should return 404 when trying to delete a non-existent project', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      return request(app.getHttpServer())
        .delete(`/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`Project with ID "${nonExistentId}" not found.`);
        });
    });
  });
});
```