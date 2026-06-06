```javascript
const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const prisma = require('../../src/database/prisma');
const userService = require('../../src/modules/users/user.service');
const { generateAuthTokens } = require('../../src/config/jwt');
const bcrypt = require('bcryptjs');

let adminUser, regularUser, adminAccessToken, regularAccessToken;

// Helper to clean database
const cleanUpDb = async () => {
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
};

beforeAll(async () => {
  await cleanUpDb();

  // Create admin and regular user for testing authentication and authorization
  adminUser = await userService.createUser({ name: 'Admin User', email: 'admin_test@example.com', password: 'AdminPassword123!', role: 'ADMIN' });
  regularUser = await userService.createUser({ name: 'Regular User', email: 'user_test@example.com', password: 'UserPassword123!', role: 'USER' });

  adminAccessToken = (await generateAuthTokens(adminUser)).accessToken;
  regularAccessToken = (await generateAuthTokens(regularUser)).accessToken;
});

afterEach(async () => {
  // We don't clean users every afterEach, as we reuse admin/regular users
  // But ensure no extra users are left from specific test cases
  await prisma.user.deleteMany({
    where: {
      NOT: {
        id: {
          in: [adminUser.id, regularUser.id],
        },
      },
    },
  });
});

afterAll(async () => {
  await cleanUpDb();
  await prisma.$disconnect();
});

describe('User Routes', () => {
  describe('POST /v1/users', () => {
    it('should return 201 and create a user if authenticated as admin', async () => {
      const newUser = {
        name: 'New Admin Created User',
        email: 'new_admin_user@example.com',
        password: 'NewUserPassword123!',
        role: 'USER',
      };

      const res = await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body.email).toBe(newUser.email);
      expect(res.body.role).toBe(newUser.role);
      expect(res.body).not.toHaveProperty('password');

      const userInDb = await prisma.user.findUnique({ where: { id: res.body.id } });
      expect(userInDb).toBeDefined();
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/v1/users')
        .send({ name: 'Unauth User', email: 'unauth@example.com', password: 'Password123!', role: 'USER' })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 403 if authenticated but not admin', async () => {
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ name: 'Forbidden User', email: 'forbidden@example.com', password: 'Password123!', role: 'USER' })
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 400 if validation fails (e.g., duplicate email)', async () => {
      await request(app)
        .post('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ name: 'Duplicate', email: adminUser.email, password: 'Password123!', role: 'USER' })
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('GET /v1/users', () => {
    it('should return 200 and all users if authenticated as admin', async () => {
      // Create an additional user to ensure query returns more than just initial setup users
      await userService.createUser({ name: 'Temp User', email: 'temp@example.com', password: 'TempPassword!', role: 'USER' });

      const res = await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(3); // adminUser, regularUser, tempUser
      expect(res.body.totalResults).toBe(3);
      expect(res.body.results.map(u => u.email)).toEqual(expect.arrayContaining([adminUser.email, regularUser.email, 'temp@example.com']));
      expect(res.body.results[0]).not.toHaveProperty('password');
    });

    it('should filter users by name if authenticated as admin', async () => {
      const res = await request(app)
        .get(`/v1/users?name=${adminUser.name}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.results).toHaveLength(1);
      expect(res.body.results[0].email).toBe(adminUser.email);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/v1/users')
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 403 if authenticated but not admin', async () => {
      await request(app)
        .get('/v1/users')
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });
  });

  describe('GET /v1/users/:userId', () => {
    it('should return 200 and user info if authenticated as admin', async () => {
      const res = await request(app)
        .get(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(regularUser.id);
      expect(res.body.email).toBe(regularUser.email);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should return 200 and user info if authenticated as owner', async () => {
      const res = await request(app)
        .get(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(regularUser.id);
      expect(res.body.email).toBe(regularUser.email);
    });

    it('should return 403 if authenticated as non-owner, non-admin user trying to access another user', async () => {
      const newUser = await userService.createUser({ name: 'Another User', email: 'another@example.com', password: 'Password123!', role: 'USER' });
      const newAccessToken = (await generateAuthTokens(newUser)).accessToken;

      await request(app)
        .get(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${newAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 404 if user not found', async () => {
      await request(app)
        .get('/v1/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /v1/users/:userId', () => {
    it('should return 200 and update user info if authenticated as owner', async () => {
      const updateBody = { name: 'Updated Regular User', email: 'updated_user@example.com' };

      const res = await request(app)
        .patch(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(regularUser.id);
      expect(res.body.name).toBe(updateBody.name);
      expect(res.body.email).toBe(updateBody.email);
      expect(res.body).not.toHaveProperty('password');

      const userInDb = await prisma.user.findUnique({ where: { id: regularUser.id } });
      expect(userInDb.name).toBe(updateBody.name);
      expect(userInDb.email).toBe(updateBody.email);
    });

    it('should return 200 and update user info if authenticated as admin', async () => {
      const updateBody = { name: 'Admin Updated Regular User', role: 'ADMIN' }; // Admin can change role

      const res = await request(app)
        .patch(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateBody)
        .expect(httpStatus.OK);

      expect(res.body.id).toBe(regularUser.id);
      expect(res.body.name).toBe(updateBody.name);
      expect(res.body.role).toBe(updateBody.role);

      const userInDb = await prisma.user.findUnique({ where: { id: regularUser.id } });
      expect(userInDb.name).toBe(updateBody.name);
      expect(userInDb.role).toBe(updateBody.role);
    });

    it('should return 403 if a regular user tries to change another user\'s profile', async () => {
      const newUser = await userService.createUser({ name: 'Another User', email: 'another_patch@example.com', password: 'Password123!', role: 'USER' });
      const newAccessToken = (await generateAuthTokens(newUser)).accessToken;

      await request(app)
        .patch(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({ name: 'Forbidden update' })
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 403 if a regular user tries to change their own role', async () => {
      await request(app)
        .patch(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .send({ role: 'ADMIN' })
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 400 if validation fails (e.g., email already taken by another user)', async () => {
      await request(app)
        .patch(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ email: adminUser.email }) // adminUser's email is already taken
        .expect(httpStatus.BAD_REQUEST);
    });
  });

  describe('DELETE /v1/users/:userId', () => {
    it('should return 204 and delete the user if authenticated as admin', async () => {
      const userToDelete = await userService.createUser({ name: 'To Delete', email: 'delete_me@example.com', password: 'Password123!', role: 'USER' });

      await request(app)
        .delete(`/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NO_CONTENT);

      const userInDb = await prisma.user.findUnique({ where: { id: userToDelete.id } });
      expect(userInDb).toBeNull();
    });

    it('should return 403 if authenticated but not admin', async () => {
      await request(app)
        .delete(`/v1/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularAccessToken}`)
        .expect(httpStatus.FORBIDDEN);
    });

    it('should return 404 if user not found', async () => {
      await request(app)
        .delete('/v1/users/non-existent-uuid')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(httpStatus.NOT_FOUND);
    });
  });
});
```