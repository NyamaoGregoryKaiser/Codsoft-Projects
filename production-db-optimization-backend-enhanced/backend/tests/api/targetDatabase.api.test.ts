import request from 'supertest';
import app from '../../src/app';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../../src/utils/jwt';

const prisma = new PrismaClient();

describe('TargetDatabase API', () => {
  let adminToken: string;
  let userToken: string;
  let adminUser: any;
  let regularUser: any;

  beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.targetDatabase.deleteMany();

    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: await bcrypt.hash('password', 10),
        role: UserRole.ADMIN,
      },
    });
    adminToken = generateToken({ userId: adminUser.id, email: adminUser.email, role: adminUser.role });

    regularUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: await bcrypt.hash('password', 10),
        role: UserRole.USER,
      },
    });
    userToken = generateToken({ userId: regularUser.id, email: regularUser.email, role: regularUser.role });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/v1/target-databases', () => {
    it('should allow an authenticated user (admin) to create a target database', async () => {
      const res = await request(app)
        .post('/api/v1/target-databases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'TestProdDB',
          type: 'PostgreSQL',
          description: 'Production DB for testing',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('TestProdDB');
      expect(res.body.ownerId).toBe(adminUser.id);
    });

    it('should allow an authenticated user (regular user) to create a target database', async () => {
      const res = await request(app)
        .post('/api/v1/target-databases')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'TestDevDB',
          type: 'MySQL',
          description: 'Development DB for regular user',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe('TestDevDB');
      expect(res.body.ownerId).toBe(regularUser.id);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/v1/target-databases')
        .send({
          name: 'Unauthorized DB',
          type: 'Mongo',
        });
      expect(res.statusCode).toEqual(401);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/target-databases')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          type: 'PostgreSQL', // Missing name
        });
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('name is required');
    });
  });

  describe('GET /api/v1/target-databases', () => {
    let db1: any;
    let db2: any;

    beforeAll(async () => {
      db1 = await prisma.targetDatabase.create({
        data: { name: 'DB 1', type: 'PostgreSQL', ownerId: adminUser.id },
      });
      db2 = await prisma.targetDatabase.create({
        data: { name: 'DB 2', type: 'MySQL', ownerId: regularUser.id },
      });
    });

    it('should allow authenticated users (admin) to get all target databases', async () => {
      const res = await request(app)
        .get('/api/v1/target-databases')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
      expect(res.body.some((db: any) => db.id === db1.id)).toBe(true);
      expect(res.body.some((db: any) => db.id === db2.id)).toBe(true);
    });

    it('should allow authenticated users (regular user) to get all target databases', async () => {
      const res = await request(app)
        .get('/api/v1/target-databases')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/v1/target-databases');
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/v1/target-databases/:id', () => {
    let testDb: any;

    beforeAll(async () => {
      testDb = await prisma.targetDatabase.create({
        data: { name: 'Specific DB', type: 'Oracle', ownerId: adminUser.id },
      });
    });

    it('should allow authenticated users to get a specific target database', async () => {
      const res = await request(app)
        .get(`/api/v1/target-databases/${testDb.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(testDb.id);
      expect(res.body.name).toBe('Specific DB');
      expect(res.body).toHaveProperty('owner.email', adminUser.email);
    });

    it('should return 404 if target database not found', async () => {
      const res = await request(app)
        .get('/api/v1/target-databases/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).get(`/api/v1/target-databases/${testDb.id}`);
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('PUT /api/v1/target-databases/:id', () => {
    let updatableDb: any;

    beforeEach(async () => {
      updatableDb = await prisma.targetDatabase.create({
        data: { name: 'Updatable DB', type: 'SQL Server', ownerId: adminUser.id },
      });
    });

    it('should allow authenticated users to update a target database', async () => {
      const res = await request(app)
        .put(`/api/v1/target-databases/${updatableDb.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ description: 'Updated description' });
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(updatableDb.id);
      expect(res.body.description).toBe('Updated description');
    });

    it('should return 404 if target database not found', async () => {
      const res = await request(app)
        .put('/api/v1/target-databases/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'New Name' });
      expect(res.statusCode).toEqual(404);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .put(`/api/v1/target-databases/${updatableDb.id}`)
        .send({ name: 'New Name' });
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('DELETE /api/v1/target-databases/:id', () => {
    let deletableDb: any;

    beforeEach(async () => {
      deletableDb = await prisma.targetDatabase.create({
        data: { name: 'Deletable DB', type: 'MongoDB', ownerId: adminUser.id },
      });
    });

    it('should allow ADMIN users to delete a target database', async () => {
      const res = await request(app)
        .delete(`/api/v1/target-databases/${deletableDb.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);
      const deletedDb = await prisma.targetDatabase.findUnique({ where: { id: deletableDb.id } });
      expect(deletedDb).toBeNull();
    });

    it('should return 403 if a regular user tries to delete a target database', async () => {
      const res = await request(app)
        .delete(`/api/v1/target-databases/${deletableDb.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(403);
      const existingDb = await prisma.targetDatabase.findUnique({ where: { id: deletableDb.id } });
      expect(existingDb).not.toBeNull();
    });

    it('should return 404 if target database not found', async () => {
      const res = await request(app)
        .delete('/api/v1/target-databases/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app).delete(`/api/v1/target-databases/${deletableDb.id}`);
      expect(res.statusCode).toEqual(401);
    });
  });
});
```