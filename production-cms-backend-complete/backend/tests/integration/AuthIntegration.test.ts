import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/data-source';
import { User, UserRole } from '../../src/entities/User';
import { Category } from '../../src/entities/Category';
import { Content } from '../../src/entities/Content';
import * as jwtHelper from '../../src/utils/jwtHelper';

let adminUser: User;
let editorUser: User;
let viewerUser: User;
let adminToken: string;
let editorToken: string;
let viewerToken: string;

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    await AppDataSource.manager.clear(Content);
    await AppDataSource.manager.clear(Category);
    await AppDataSource.manager.clear(User);

    adminUser = new User();
    adminUser.email = 'admin-it@test.com';
    adminUser.password = 'password123';
    adminUser.role = UserRole.ADMIN;
    await adminUser.hashPassword();
    await AppDataSource.manager.save(adminUser);
    adminToken = jwtHelper.generateToken(adminUser);

    editorUser = new User();
    editorUser.email = 'editor-it@test.com';
    editorUser.password = 'password123';
    editorUser.role = UserRole.EDITOR;
    await editorUser.hashPassword();
    await AppDataSource.manager.save(editorUser);
    editorToken = jwtHelper.generateToken(editorUser);

    viewerUser = new User();
    viewerUser.email = 'viewer-it@test.com';
    viewerUser.password = 'password123';
    viewerUser.role = UserRole.VIEWER;
    await viewerUser.hashPassword();
    await AppDataSource.manager.save(viewerUser);
    viewerToken = jwtHelper.generateToken(viewerUser);
  });

  afterAll(async () => {
    await AppDataSource.manager.clear(Content);
    await AppDataSource.manager.clear(Category);
    await AppDataSource.manager.clear(User);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  // --- POST /api/v1/auth/register ---
  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with default VIEWER role', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('newuser@test.com');
      expect(res.body.data.user.role).toBe(UserRole.VIEWER);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should not register with existing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@test.com',
          password: 'anotherpassword',
        });
      expect(res.statusCode).toEqual(400); // Or 409 depending on exact error handling
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('User with this email already exists.');
    });

    it('should not allow non-admin to register with ADMIN role', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({
            email: 'unprivileged@test.com',
            password: 'password123',
            role: UserRole.ADMIN,
          });
        expect(res.statusCode).toEqual(403);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain('Cannot register with this role without admin privileges.');
    });
  });

  // --- POST /api/v1/auth/login ---
  describe('POST /api/v1/auth/login', () => {
    it('should log in an existing user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin-it@test.com',
          password: 'password123',
        });
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('admin-it@test.com');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should return 401 for invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'admin-it@test.com',
          password: 'wrongpassword',
        });
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  // --- GET /api/v1/auth/me ---
  describe('GET /api/v1/auth/me', () => {
    it('should return current user profile for authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(adminUser.email);
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 401 for unauthenticated access', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- GET /api/v1/auth/users (Admin only) ---
  describe('GET /api/v1/auth/users', () => {
    it('should allow ADMIN to fetch all users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3); // admin, editor, viewer, and newuser
      expect(res.body).toHaveProperty('meta');
    });

    it('should return 403 for EDITOR fetching all users', async () => {
      const res = await request(app)
        .get('/api/v1/auth/users')
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('is not authorized');
    });

    it('should return 401 for unauthenticated fetching all users', async () => {
      const res = await request(app).get('/api/v1/auth/users');
      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
    });
  });

  // --- PUT /api/v1/auth/users/:id (Admin only) ---
  describe('PUT /api/v1/auth/users/:id', () => {
    it('should allow ADMIN to update a user (e.g., role)', async () => {
      const res = await request(app)
        .put(`/api/v1/auth/users/${viewerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.EDITOR });
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(viewerUser.id);
      expect(res.body.data.role).toBe(UserRole.EDITOR);
    });

    it('should return 403 for EDITOR updating a user', async () => {
      const res = await request(app)
        .put(`/api/v1/auth/users/${editorUser.id}`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ email: 'newemail@test.com' });
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for updating a non-existent user', async () => {
      const res = await request(app)
        .put('/api/v1/auth/users/nonexistent-uuid')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'nonexistent@test.com' });
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('User not found');
    });
  });

  // --- DELETE /api/v1/auth/users/:id (Admin only) ---
  describe('DELETE /api/v1/auth/users/:id', () => {
    it('should allow ADMIN to delete a user', async () => {
      const userToDelete = new User();
      userToDelete.email = 'delete@test.com';
      userToDelete.password = 'password123';
      userToDelete.role = UserRole.VIEWER;
      await userToDelete.hashPassword();
      await AppDataSource.manager.save(userToDelete);

      const res = await request(app)
        .delete(`/api/v1/auth/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(204);

      const checkRes = await request(app)
        .get(`/api/v1/auth/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.statusCode).toEqual(404);
    });

    it('should return 403 for EDITOR deleting a user', async () => {
      const res = await request(app)
        .delete(`/api/v1/auth/users/${editorUser.id}`)
        .set('Authorization', `Bearer ${editorToken}`);
      expect(res.statusCode).toEqual(403);
    });

    it('should return 404 for deleting a non-existent user', async () => {
      const res = await request(app)
        .delete('/api/v1/auth/users/nonexistent-uuid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(404);
    });
  });
});