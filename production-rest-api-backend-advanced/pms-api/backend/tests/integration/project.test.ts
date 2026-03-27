import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/db/data-source';
import { User, UserRole } from '../../src/modules/users/user.entity';
import { Project } from '../../src/modules/projects/project.entity';
import { hashPassword } from '../../src/utils/password';
import { generateToken } from '../../src/utils/jwt';
import { clearAllCache } from '../../src/middleware/cache';

describe('Project API (Integration)', () => {
  let adminUser: User;
  let memberUser: User;
  let adminToken: string;
  let memberToken: string;
  let projectCreatedByMember: Project;
  let projectCreatedByAdmin: Project;

  beforeAll(async () => {
    const userRepository = AppDataSource.getRepository(User);
    const projectRepository = AppDataSource.getRepository(Project);

    // Clear all related tables (projects, users, tasks if any)
    await projectRepository.query(`TRUNCATE TABLE "tasks" RESTART IDENTITY CASCADE;`);
    await projectRepository.query(`TRUNCATE TABLE "projects" RESTART IDENTITY CASCADE;`);
    await userRepository.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);


    // Create admin user
    adminUser = userRepository.create({
      username: 'adminProject',
      email: 'adminproject@test.com',
      password: await hashPassword('AdminPass123!'),
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);
    adminToken = generateToken(adminUser.id, adminUser.role);

    // Create member user
    memberUser = userRepository.create({
      username: 'memberProject',
      email: 'memberproject@test.com',
      password: await hashPassword('MemberPass123!'),
      role: UserRole.MEMBER,
    });
    await userRepository.save(memberUser);
    memberToken = generateToken(memberUser.id, memberUser.role);

    // Create a project by member
    projectCreatedByMember = projectRepository.create({
      name: 'Member Project',
      description: 'A project created by a regular member.',
      createdById: memberUser.id,
    });
    await projectRepository.save(projectCreatedByMember);

    // Create a project by admin
    projectCreatedByAdmin = projectRepository.create({
      name: 'Admin Project',
      description: 'A project created by an admin.',
      createdById: adminUser.id,
    });
    await projectRepository.save(projectCreatedByAdmin);

    clearAllCache(); // Clear cache before tests
  });

  afterEach(async () => {
    // Clean up any dynamically created projects
    const projectRepository = AppDataSource.getRepository(Project);
    await projectRepository.delete({ name: 'New Test Project' });
    await projectRepository.delete({ name: 'Updated Test Project' });
    clearAllCache(); // Clear cache after each test to ensure fresh state
  });

  // --- GET /api/v1/projects ---
  describe('GET /api/v1/projects', () => {
    it('should return all projects for authenticated users', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body.some((p: any) => p.name === projectCreatedByMember.name)).toBe(true);
      expect(res.body.some((p: any) => p.name === projectCreatedByAdmin.name)).toBe(true);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/projects');
      expect(res.statusCode).toEqual(401);
    });
  });

  // --- GET /api/v1/projects/:id ---
  describe('GET /api/v1/projects/:id', () => {
    it('should return a specific project for authenticated users', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${projectCreatedByMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(projectCreatedByMember.id);
      expect(res.body.name).toEqual(projectCreatedByMember.name);
      expect(res.body.createdById).toEqual(memberUser.id);
      expect(res.body).toHaveProperty('createdByUsername');
    });

    it('should return 404 if project not found', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const res = await request(app)
        .get(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Project not found.');
    });
  });

  // --- POST /api/v1/projects ---
  describe('POST /api/v1/projects', () => {
    it('should allow authenticated users to create a new project', async () => {
      const newProject = {
        name: 'New Test Project',
        description: 'This is a brand new project for testing.',
      };
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send(newProject);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual(newProject.name);
      expect(res.body.description).toEqual(newProject.description);
      expect(res.body.createdById).toEqual(memberUser.id);
    });

    it('should return 400 if project name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'No name' });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Project name is required.');
    });

    it('should return 409 if project name already exists', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ name: projectCreatedByMember.name, description: 'Duplicate name test' });
      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('Project with this name already exists.');
    });
  });

  // --- PUT /api/v1/projects/:id ---
  describe('PUT /api/v1/projects/:id', () => {
    it('should allow the project creator to update their project', async () => {
      const updateData = { name: 'Updated Member Project Name', description: 'Updated description.' };
      const res = await request(app)
        .put(`/api/v1/projects/${projectCreatedByMember.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updateData.name);
      expect(res.body.description).toEqual(updateData.description);
    });

    it('should allow an admin to update any project', async () => {
      const updateData = { name: 'Updated Admin Project Name by Admin', description: 'Updated by admin.' };
      const res = await request(app)
        .put(`/api/v1/projects/${projectCreatedByMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updateData.name);
    });

    it('should return 403 if a non-creator/non-admin tries to update', async () => {
      const newMember = AppDataSource.getRepository(User).create({
        username: 'otherMember',
        email: 'other@test.com',
        password: await hashPassword('OtherPass123!'),
        role: UserRole.MEMBER,
      });
      await AppDataSource.getRepository(User).save(newMember);
      const otherMemberToken = generateToken(newMember.id, newMember.role);

      const res = await request(app)
        .put(`/api/v1/projects/${projectCreatedByMember.id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`)
        .send({ name: 'Forbidden Update' });
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Forbidden: You can only update projects you created.');
    });

    it('should return 404 if updating non-existent project', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const res = await request(app)
        .put(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Non Existent' });
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if no update data is provided', async () => {
      const res = await request(app)
        .put(`/api/v1/projects/${projectCreatedByMember.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('At least one field (name, description) must be provided for update.');
    });
  });

  // --- DELETE /api/v1/projects/:id ---
  describe('DELETE /api/v1/projects/:id', () => {
    let tempProject: Project;

    beforeEach(async () => {
      const projectRepository = AppDataSource.getRepository(Project);
      tempProject = projectRepository.create({
        name: 'Temp Project to Delete',
        description: 'This project will be deleted.',
        createdById: memberUser.id,
      });
      await projectRepository.save(tempProject);
    });

    it('should allow the project creator to delete their project', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${tempProject.id}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.statusCode).toEqual(204);
      const deletedProject = await AppDataSource.getRepository(Project).findOneBy({ id: tempProject.id });
      expect(deletedProject).toBeNull();
    });

    it('should allow an admin to delete any project', async () => {
      const projectRepository = AppDataSource.getRepository(Project);
      const anotherTempProject = projectRepository.create({
        name: 'Another Temp Project to Delete',
        description: 'This project will be deleted by admin.',
        createdById: memberUser.id, // Created by member, deleted by admin
      });
      await projectRepository.save(anotherTempProject);

      const res = await request(app)
        .delete(`/api/v1/projects/${anotherTempProject.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
      const deletedProject = await projectRepository.findOneBy({ id: anotherTempProject.id });
      expect(deletedProject).toBeNull();
    });

    it('should return 403 if a non-creator/non-admin tries to delete', async () => {
      const newMember = AppDataSource.getRepository(User).create({
        username: 'otherMemberForDelete',
        email: 'otherdelete@test.com',
        password: await hashPassword('OtherPass123!'),
        role: UserRole.MEMBER,
      });
      await AppDataSource.getRepository(User).save(newMember);
      const otherMemberToken = generateToken(newMember.id, newMember.role);

      const res = await request(app)
        .delete(`/api/v1/projects/${tempProject.id}`)
        .set('Authorization', `Bearer ${otherMemberToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Forbidden: You can only delete projects you created.');
    });

    it('should return 404 if deleting non-existent project', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const res = await request(app)
        .delete(`/api/v1/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});