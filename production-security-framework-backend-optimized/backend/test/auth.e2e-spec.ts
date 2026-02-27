```typescript
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpStatus } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/users/enums/user-role.enum';

describe('AuthController (e2e)', () => {
  let app;
  let dataSource: DataSource;
  let adminUser: User;
  let testUser: User;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    // Ensure database is clean and seeded for a consistent test state
    // Note: global-setup.ts should handle initial seeding.
    // For individual tests, ensure isolation or clean up if state changes.
    const userRepository = dataSource.getRepository(User);
    await userRepository.delete({}); // Clear users to ensure fresh state

    const hashedPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = userRepository.create({
      name: 'Admin Test',
      email: 'admin_test@example.com',
      password: hashedPassword,
      roles: [UserRole.Admin],
    });
    await userRepository.save(adminUser);

    testUser = userRepository.create({
      name: 'Test User',
      email: 'test_user@example.com',
      password: await bcrypt.hash('TestPassword123!', 10),
      roles: [UserRole.User],
    });
    await userRepository.save(testUser);
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'new_user@example.com',
        password: 'NewUserPassword123!',
      };
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.message).toEqual('User registered successfully. Please login.');
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toEqual(newUser.email);
          expect(res.body.user.roles).toEqual([UserRole.User]);
        });
    });

    it('should prevent registration with existing email', async () => {
      const newUser = {
        name: 'Duplicate User',
        email: testUser.email, // Use an existing email
        password: 'DupPassword123!',
      };
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body.message).toEqual(`User with email "${testUser.email}" already exists.`);
        });
    });

    it('should reject registration with invalid password (too short)', async () => {
      const invalidUser = {
        name: 'Invalid User',
        email: 'invalid@example.com',
        password: 'short',
      };
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidUser)
        .expect(HttpStatus.BAD_REQUEST)
        .expect((res) => {
          expect(res.body.message).toContain('Password must be at least 8 characters long');
        });
    });
  });

  describe('/auth/login (POST)', () => {
    it('should log in an existing user and return tokens', async () => {
      const loginCredentials = {
        email: testUser.email,
        password: 'TestPassword123!',
      };
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toEqual(loginCredentials.email);
          expect(res.body.accessToken).toBeString();
          expect(res.headers['set-cookie']).toBeArrayOfSize(1);
          expect(res.headers['set-cookie'][0]).toInclude('Refresh=');
          expect(res.headers['set-cookie'][0]).toInclude('HttpOnly');
          expect(res.headers['set-cookie'][0]).toInclude('Path=/auth/refresh');
          expect(res.headers['set-cookie'][0]).toInclude('SameSite=Lax');
        });
    });

    it('should reject login with invalid credentials', async () => {
      const loginCredentials = {
        email: testUser.email,
        password: 'wrongpassword',
      };
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid credentials');
        });
    });

    it('should reject login with non-existent email', async () => {
      const loginCredentials = {
        email: 'nonexistent@example.com',
        password: 'anypassword',
      };
      return request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid credentials');
        });
    });
  });

  describe('/auth/refresh (POST)', () => {
    let refreshToken: string;
    let loginResponse: request.Response;

    beforeEach(async () => {
      const loginCredentials = {
        email: testUser.email,
        password: 'TestPassword123!',
      };
      loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(HttpStatus.OK);

      const cookies = loginResponse.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('Refresh='));
      refreshToken = refreshCookie.split(';')[0].replace('Refresh=', '');
    });

    it('should refresh access token using a valid refresh token', async () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`Refresh=${refreshToken}`])
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toEqual(testUser.email);
          expect(res.body.accessToken).toBeString();
          expect(res.headers['set-cookie']).toBeArrayOfSize(1);
          expect(res.headers['set-cookie'][0]).toInclude('Refresh=');
          expect(res.headers['set-cookie'][0]).toInclude('HttpOnly');
          expect(res.headers['set-cookie'][0]).toInclude('Path=/auth/refresh');
        });
    });

    it('should reject refresh token if missing from cookies', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Refresh token required');
        });
    });

    it('should reject refresh token if invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['Refresh=invalidtoken'])
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid refresh token');
        });
    });

    it('should invalidate old refresh token and provide a new one (rotation)', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`Refresh=${refreshToken}`])
        .expect(HttpStatus.OK);

      const newRefreshToken = res1.headers['set-cookie'][0].split(';')[0].replace('Refresh=', '');
      expect(newRefreshToken).not.toEqual(refreshToken);

      // Attempt to use the old refresh token, should fail
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`Refresh=${refreshToken}`]) // Old token
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid or revoked refresh token. Please re-login.');
        });

      // Attempt to use the new refresh token, should succeed
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`Refresh=${newRefreshToken}`]) // New token
        .expect(HttpStatus.OK);
    });
  });

  describe('/auth/logout (POST)', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      const loginCredentials = {
        email: testUser.email,
        password: 'TestPassword123!',
      };
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginCredentials)
        .expect(HttpStatus.OK);

      accessToken = loginResponse.body.accessToken;
      const cookies = loginResponse.headers['set-cookie'];
      const refreshCookie = cookies.find((c) => c.startsWith('Refresh='));
      refreshToken = refreshCookie.split(';')[0].replace('Refresh=', '');
    });

    it('should log out a user and clear refresh token cookie', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`Refresh=${refreshToken}`])
        .expect(HttpStatus.NO_CONTENT)
        .expect((res) => {
          // Check that the refresh token cookie is cleared
          expect(res.headers['set-cookie']).toBeArrayOfSize(1);
          expect(res.headers['set-cookie'][0]).toInclude('Refresh=;');
          expect(res.headers['set-cookie'][0]).toInclude('Max-Age=0');
        });
    });

    it('should return 204 if no refresh token cookie is present', async () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(HttpStatus.NO_CONTENT); // Still 204 even if no token to clear
    });

    it('should prevent using a logged out refresh token for refresh', async () => {
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`Refresh=${refreshToken}`])
        .expect(HttpStatus.NO_CONTENT);

      // Attempt to refresh with the invalidated token
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`Refresh=${refreshToken}`])
        .expect(HttpStatus.UNAUTHORIZED)
        .expect((res) => {
          expect(res.body.message).toEqual('Invalid or revoked refresh token. Please re-login.');
        });
    });
  });
});
```