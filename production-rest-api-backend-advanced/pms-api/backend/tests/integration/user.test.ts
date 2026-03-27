import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/db/data-source';
import { User, UserRole } from '../../src/modules/users/user.entity';
import { hashPassword } from '../../src/utils/password';
import { generateToken } from '../../src/utils/jwt';

describe('User API (Integration - Admin Only)', () => {
  let adminUser: User;
  let memberUser: User;
  let adminToken: string;
  let memberToken: string;
  let testUser: User;

  beforeAll(async () => {
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.query(`TRUNCATE TABLE "users" RESTART IDENTITY CASCADE;`);

    // Create admin user
    adminUser = userRepository.create({
      username: 'admin',
      email: 'admin@test.com',
      password: await hashPassword('AdminPass123!'),
      role: UserRole.ADMIN,
    });
    await userRepository.save(adminUser);
    adminToken = generateToken(adminUser.id, adminUser.role);

    // Create member user
    memberUser = userRepository.create({
      username: 'member',
      email: 'member@test.com',
      password: await hashPassword('MemberPass123!'),
      role: UserRole.MEMBER,
    });
    await userRepository.save(memberUser);
    memberToken = generateToken(memberUser.id, memberUser.role);

    // Create a user to be managed by admin
    testUser = userRepository.create({
      username: 'testuser_crud',
      email: 'testuser_crud@test.com',
      password: await hashPassword('TestPass123!'),
      role: UserRole.MEMBER,
    });
    await userRepository.save(testUser);
  });

  afterEach(async () => {
    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete({ email: 'new_testuser@test.com' });
    await userRepository.delete({ email: 'updated_testuser@test.com' });
  });

  // --- GET /api/v1/users ---
  describe('GET /api/v1/users', () => {
    it('should allow admin to get all users', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBeGreaterThanOrEqual(3); // admin, member, testuser_crud
      expect(res.body.some((u: any) => u.email === adminUser.email)).toBe(true);
      expect(res.body.some((u: any) => u.email === memberUser.email)).toBe(true);
      expect(res.body.some((u: any) => u.email === testUser.email)).toBe(true);
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/v1/users');
      expect(res.statusCode).toEqual(401);
    });

    it('should return 403 if user is not an admin', async () => {
      const res = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${memberToken}`);
      expect(res.statusCode).toEqual(403);
    });
  });

  // --- GET /api/v1/users/:id ---
  describe('GET /api/v1/users/:id', () => {
    it('should allow admin to get a user by ID', async () => {
      const res = await request(app)
        .get(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(testUser.id);
      expect(res.body.email).toEqual(testUser.email);
    });

    it('should return 404 if user not found', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      const res = await request(app)
        .get(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('User not found.');
    });
  });

  // --- POST /api/v1/users ---
  describe('POST /api/v1/users', () => {
    it('should allow admin to create a new user', async () => {
      const newUser = {
        username: 'new_testuser',
        email: 'new_testuser@test.com',
        password: 'NewUserPass123!',
        role: UserRole.MEMBER,
      };
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.username).toEqual(newUser.username);
      expect(res.body.email).toEqual(newUser.email);
      expect(res.body.role).toEqual(newUser.role);
    });

    it('should return 409 if creating user with existing email', async () => {
      const newUser = {
        username: 'duplicate_email',
        email: adminUser.email, // existing email
        password: 'NewUserPass123!',
        role: UserRole.MEMBER,
      };
      const res = await request(app)
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.message).toBe('User with this email or username already exists.');
    });
  });

  // --- PUT /api/v1/users/:id ---
  describe('PUT /api/v1/users/:id', () => {
    it('should allow admin to update an existing user', async () => {
      const updateData = {
        username: 'updated_testuser_crud',
        email: 'updated_testuser@test.com',
        role: UserRole.ADMIN,
      };
      const res = await request(app)
        .put(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(testUser.id);
      expect(res.body.username).toEqual(updateData.username);
      expect(res.body.email).toEqual(updateData.email);
      expect(res.body.role).toEqual(updateData.role);

      // Verify DB update
      const updatedUserInDb = await AppDataSource.getRepository(User).findOneBy({ id: testUser.id });
      expect(updatedUserInDb?.username).toEqual(updateData.username);
    });

    it('should return 404 if updating non-existent user', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const res = await request(app)
        .put(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ username: 'nonexistent_update' });
      expect(res.statusCode).toEqual(404);
    });

    it('should return 400 if no update data is provided', async () => {
      const res = await request(app)
        .put(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('At least one field (username, email, password, or role) must be provided for update.');
    });
  });

  // --- DELETE /api/v1/users/:id ---
  describe('DELETE /api/v1/users/:id', () => {
    let userToDelete: User;

    beforeEach(async () => {
      userToDelete = AppDataSource.getRepository(User).create({
        username: 'todelete_user',
        email: 'todelete@test.com',
        password: await hashPassword('DeleteMe123!'),
        role: UserRole.MEMBER,
      });
      await AppDataSource.getRepository(User).save(userToDelete);
    });

    it('should allow admin to delete a user', async () => {
      const res = await request(app)
        .delete(`/api/v1/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
      const deletedUser = await AppDataSource.getRepository(User).findOneBy({ id: userToDelete.id });
      expect(deletedUser).toBeNull();
    });

    it('should return 404 if deleting non-existent user', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      const res = await request(app)
        .delete(`/api/v1/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});