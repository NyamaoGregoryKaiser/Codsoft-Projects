import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import { UserRole } from '@prisma/client';
import { redisClient } from '../../src/middleware/cache.middleware';

describe('User API Endpoints', () => {
  let adminAccessToken: string;
  let regularAccessToken: string;
  let testUserId: string;
  let adminUserId: string;

  const adminCredentials = {
    email: 'admin_user_test@example.com',
    password: 'adminpassword',
    name: 'Admin User Test',
  };

  const regularUserCredentials = {
    email: 'regular_user_test@example.com',
    password: 'userpassword',
    name: 'Regular User Test',
  };

  beforeAll(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await redisClient.flushdb();

    // Register and login admin user
    const adminRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ ...adminCredentials, role: UserRole.ADMIN });
    adminUserId = adminRegisterRes.body.data.id;

    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send(adminCredentials);
    adminAccessToken = adminLoginRes.body.data.accessToken;

    // Register and login a regular user
    const regularRegisterRes = await request(app)
      .post('/api/v1/auth/register')
      .send(regularUserCredentials);
    testUserId = regularRegisterRes.body.data.id;

    const regularLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send(regularUserCredentials);
    regularAccessToken = regularLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();
    await redisClient.flushdb();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/users', () => {
    const newUser = {
      email: 'new@example.com',
      password: 'newpassword',
      name: 'New User',
      role: UserRole.USER,
    };

    it('should allow an admin to create a new user', async () => {
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe(newUser.email);
    });

    it('should return 403 if a regular user tries to create a user', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ ...newUser, email: 'another@example.com' })
        .expect(403);
    });

    it('should return 401 if unauthenticated user tries to create a user', async () => {
      await request(app)
        .post('/api/v1/users')
        .send({ ...newUser, email: 'unauth@example.com' })
        .expect(401);
    });

    it('should return 400 for invalid input', async () => {
      await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ...newUser, email: 'invalid-email' })
        .expect(400);
    });
  });

  describe('GET /api/v1/users', () => {
    it('should allow an admin to get all users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should return 403 if a regular user tries to get all users', async () => {
      await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/v1/users/:userId', () => {
    it('should allow an admin to get any user by ID', async () => {
      expect(testUserId).toBeDefined();
      const res = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.email).toBe(regularUserCredentials.email);
    });

    it('should allow a regular user to get their own profile by ID', async () => {
      expect(testUserId).toBeDefined();
      const res = await request(app)
        .get(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.email).toBe(regularUserCredentials.email);
    });

    it('should return 403 if a regular user tries to get another user\'s profile', async () => {
      expect(adminUserId).toBeDefined();
      await request(app)
        .get(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(403);
    });

    it('should return 404 for a non-existent user ID', async () => {
      await request(app)
        .get('/api/v1/users/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/users/:userId', () => {
    const updateData = {
      name: 'Updated Name',
      email: 'updated_regular_user@example.com',
    };

    it('should allow an admin to update any user by ID', async () => {
      expect(testUserId).toBeDefined();
      const res = await request(app)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(testUserId);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.email).toBe(updateData.email);

      // Update regular user credentials for potential re-login
      regularUserCredentials.email = updateData.email;
    });

    it('should return 403 if a regular user tries to update another user', async () => {
      expect(adminUserId).toBeDefined();
      await request(app)
        .patch(`/api/v1/users/${adminUserId}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: 'Should Not Change' })
        .expect(403);
    });

    it('should return 403 if a regular user tries to update their own profile (current implementation is admin only)', async () => {
      // NOTE: The current `user.routes.ts` limits PATCH /users/:userId to ADMIN role.
      // For a more complete app, you'd add logic to allow users to update their *own* profile.
      await request(app)
        .patch(`/api/v1/users/${testUserId}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: 'Self Update' })
        .expect(403);
    });

    it('should return 404 for updating a non-existent user', async () => {
      await request(app)
        .patch('/api/v1/users/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/users/:userId', () => {
    it('should allow an admin to delete any user by ID', async () => {
      // Create a temporary user to delete
      const tempUserRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: 'temp@example.com', password: 'temp123', name: 'Temp User' })
        .expect(201);
      const tempUserId = tempUserRes.body.data.id;

      await request(app)
        .delete(`/api/v1/users/${tempUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(204);

      // Verify user is actually deleted
      await request(app)
        .get(`/api/v1/users/${tempUserId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });

    it('should return 403 if a regular user tries to delete a user', async () => {
      // Recreate a user for this test, as previous might have been deleted
      const tempUserRes = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: 'temp2@example.com', password: 'temp123', name: 'Temp User 2' })
        .expect(201);
      const tempUserId = tempUserRes.body.data.id;

      await request(app)
        .delete(`/api/v1/users/${tempUserId}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(403);
    });

    it('should return 404 for deleting a non-existent user', async () => {
      await request(app)
        .delete('/api/v1/users/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });
});