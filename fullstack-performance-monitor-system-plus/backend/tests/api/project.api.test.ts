import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/database/prisma-client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });
const JWT_SECRET = process.env.JWT_SECRET!;

describe('Project API E2E Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('password123', 12);
    testUser = await prisma.user.create({
      data: {
        name: 'Project Test User',
        email: 'projecttest@example.com',
        passwordHash: hashedPassword,
      },
    });
    authToken = jwt.sign({ id: testUser.id }, JWT_SECRET, { expiresIn: '1h' });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My New Project' });

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.project).toBeDefined();
      expect(res.body.data.project.name).toBe('My New Project');
      expect(res.body.data.project.ownerId).toBe(testUser.id);
      expect(res.body.data.project.apikey).toBeDefined();

      const projectInDb = await prisma.project.findUnique({ where: { id: res.body.data.project.id } });
      expect(projectInDb).toBeDefined();
    });

    it('should return 400 for invalid input', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Sh' }); // Name too short

      expect(res.statusCode).toEqual(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toMatch(/name must be at least 3 characters long/);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/projects')
        .send({ name: 'Unauthorized Project' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      await prisma.project.createMany({
        data: [
          { name: 'Project A', ownerId: testUser.id, apikey: 'key-a' },
          { name: 'Project B', ownerId: testUser.id, apikey: 'key-b' },
        ],
      });
    });

    it('should retrieve all projects for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.results).toBe(2);
      expect(res.body.data.projects.length).toBe(2);
      expect(res.body.data.projects[0].ownerId).toBe(testUser.id);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/projects');

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('Project Specific Routes (/api/projects/:projectId)', () => {
    let ownedProject: any;
    let otherUser: any;
    let otherUserToken: string;

    beforeEach(async () => {
      ownedProject = await prisma.project.create({
        data: { name: 'Owned Project', ownerId: testUser.id, apikey: 'owned-key' },
      });

      const hashedPassword = await bcrypt.hash('otherpassword', 12);
      otherUser = await prisma.user.create({
        data: {
          name: 'Other User',
          email: 'other@example.com',
          passwordHash: hashedPassword,
        },
      });
      otherUserToken = jwt.sign({ id: otherUser.id }, JWT_SECRET, { expiresIn: '1h' });
    });

    describe('GET /api/projects/:projectId', () => {
      it('should retrieve a specific project if owned by the user', async () => {
        const res = await request(app)
          .get(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.project.id).toBe(ownedProject.id);
        expect(res.body.data.project.name).toBe('Owned Project');
      });

      it('should return 404 if project does not exist', async () => {
        const res = await request(app)
          .get(`/api/projects/nonexistent-id`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(404);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('Project not found.');
      });

      it('should return 403 if project is not owned by the user', async () => {
        const res = await request(app)
          .get(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.status).toBe('error');
        expect(res.body.message).toBe('You do not have permission to access this project.');
      });
    });

    describe('PUT /api/projects/:projectId', () => {
      it('should update a specific project if owned by the user', async () => {
        const res = await request(app)
          .put(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Updated Project Name' });

        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('success');
        expect(res.body.data.project.name).toBe('Updated Project Name');

        const projectInDb = await prisma.project.findUnique({ where: { id: ownedProject.id } });
        expect(projectInDb?.name).toBe('Updated Project Name');
      });

      it('should return 403 if project is not owned by the user', async () => {
        const res = await request(app)
          .put(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`)
          .send({ name: 'Attempted Update' });

        expect(res.statusCode).toEqual(403);
        expect(res.body.status).toBe('error');
      });
    });

    describe('DELETE /api/projects/:projectId', () => {
      it('should delete a specific project if owned by the user', async () => {
        const res = await request(app)
          .delete(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.statusCode).toEqual(204);
        expect(res.body).toEqual({}); // No content for 204

        const projectInDb = await prisma.project.findUnique({ where: { id: ownedProject.id } });
        expect(projectInDb).toBeNull();
      });

      it('should also delete associated metrics', async () => {
        await prisma.metric.create({
          data: {
            projectId: ownedProject.id,
            type: 'LCP',
            value: 1234,
            timestamp: new Date(),
            context: {},
          },
        });

        let metricsCount = await prisma.metric.count({ where: { projectId: ownedProject.id } });
        expect(metricsCount).toBe(1);

        await request(app)
          .delete(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${authToken}`);

        metricsCount = await prisma.metric.count({ where: { projectId: ownedProject.id } });
        expect(metricsCount).toBe(0);
      });

      it('should return 403 if project is not owned by the user', async () => {
        const res = await request(app)
          .delete(`/api/projects/${ownedProject.id}`)
          .set('Authorization', `Bearer ${otherUserToken}`);

        expect(res.statusCode).toEqual(403);
        expect(res.body.status).toBe('error');
      });
    });
  });
});