```typescript
// backend/test/users.e2e-spec.ts (Example of E2E/Integration test for Users)
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let adminToken: string;
  let regularUserToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    authService = moduleFixture.get<AuthService>(AuthService);

    // Clear and re-seed the database for tests
    await prisma.$transaction([
      prisma.dashboardPanel.deleteMany(),
      prisma.dashboard.deleteMany(),
      prisma.chart.deleteMany(),
      prisma.dataSource.deleteMany(),
      prisma.user.deleteMany(),
    ]);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminUser = await prisma.user.create({
      data: {
        email: 'test_admin@example.com',
        username: 'test_admin',
        password: hashedPassword,
        role: UserRole.ADMIN,
      },
    });
    const regularUser = await prisma.user.create({
      data: {
        email: 'test_user@example.com',
        username: 'test_user',
        password: hashedPassword,
        role: UserRole.USER,
      },
    });

    adminUserId = adminUser.id;
    regularUserId = regularUser.id;

    // Generate tokens for test users
    adminToken = (await authService.login({ email: adminUser.email, password: 'password123' })).accessToken;
    regularUserToken = (await authService.login({ email: regularUser.email, password: 'password123' })).accessToken;

    await app.init();
  });

  afterAll(async () => {
    await prisma.$transaction([
      prisma.dashboardPanel.deleteMany(),
      prisma.dashboard.deleteMany(),
      prisma.chart.deleteMany(),
      prisma.dataSource.deleteMany(),
      prisma.user.deleteMany(),
    ]);
    await app.close();
  });

  describe('/api/users (POST)', () => {
    it('should create a new user by an admin', async () => {
      const newUser = {
        email: 'new_user@example.com',
        username: 'new_user',
        password: 'password123',
        role: UserRole.USER,
      };
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            email: newUser.email,
            username: newUser.username,
            role: newUser.role,
          });
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should prevent creating a user with existing email', async () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test_admin@example.com', // Existing email
          username: 'another_new_user',
          password: 'password123',
          role: UserRole.USER,
        })
        .expect(409) // Conflict
        .expect((res) => {
          expect(res.body.message).toEqual('User with this email already exists.');
        });
    });

    it('should prevent non-admin from creating a user', async () => {
      return request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          email: 'no_admin@example.com',
          username: 'no_admin',
          password: 'password123',
          role: UserRole.USER,
        })
        .expect(403); // Forbidden
    });
  });

  describe('/api/users (GET)', () => {
    it('should allow admin to get all users', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBeGreaterThanOrEqual(2); // admin, regular, and newly created
          expect(res.body[0]).not.toHaveProperty('password');
        });
    });

    it('should prevent non-admin from getting all users', async () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  // Add tests for GET /api/users/:id, PATCH /api/users/:id, DELETE /api/users/:id
  // including authorization checks for self vs other users.

  describe('/api/users/:id (GET)', () => {
    it('should allow an admin to retrieve any user', async () => {
      return request(app.getHttpServer())
        .get(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(regularUserId);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should allow a regular user to retrieve their own profile', async () => {
      return request(app.getHttpServer())
        .get(`/api/users/${regularUserId}`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toEqual(regularUserId);
        });
    });

    it('should prevent a regular user from retrieving another user\'s profile', async () => {
      return request(app.getHttpServer())
        .get(`/api/users/${adminUserId}`) // Regular user trying to get admin profile
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403); // Or 404 if authorization logic is to hide existence
    });

    it('should return 404 for a non-existent user', async () => {
      return request(app.getHttpServer())
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});
```