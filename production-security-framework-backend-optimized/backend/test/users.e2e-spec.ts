```typescript
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../src/users/enums/user-role.enum';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminUser: User;
  let regularUser: User;
  let adminAccessToken: string;
  let regularUserAccessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    dataSource = app.get(DataSource);

    // Clean up users and create test users
    const userRepository = dataSource.getRepository(User);
    await userRepository.delete({});

    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await userRepository.save({
      name: 'Admin User',
      email: 'admin_users_test@example.com',
      password: adminPassword,
      roles: [UserRole.Admin],
    });

    const regularPassword = await bcrypt.hash('RegularPassword123!', 10);
    regularUser = await userRepository.save({
      name: 'Regular User',
      email: 'regular_users_test@example.com',
      password: regularPassword,
      roles: [UserRole.User],
    });

    // Get access tokens
    const adminLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: adminUser.email, password: 'AdminPassword123!' });
    adminAccessToken = adminLoginRes.body.accessToken;

    const regularLoginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: regularUser.email, password: 'RegularPassword123!' });
    regularUserAccessToken = regularLoginRes.body.accessToken;
  });

  afterAll(async () => {
    await dataSource.destroy();
    await app.close();
  });

  describe('/users (POST)', () => {
    it('should allow admin to create a new user', async () => {
      const newUser = {
        name: 'Created User',
        email: 'created_user@example.com',
        password: 'CreatedPassword123!',
        roles: [UserRole.User],
      };
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(HttpStatus.CREATED)
        .expect((res) => {
          expect(res.body.email).toEqual(newUser.email);
          expect(res.body.roles).toEqual([UserRole.User]);
          expect(res.body.password).not.toBeDefined(); // Password should not be returned
        });
    });

    it('should prevent regular user from creating a new user', async () => {
      const newUser = {
        name: 'Unauthorized User',
        email: 'unauth_user@example.com',
        password: 'UnauthPassword123!',
      };
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .send(newUser)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden resource');
        });
    });

    it('should reject creation with existing email', async () => {
      const newUser = {
        name: 'Duplicate Email User',
        email: adminUser.email, // Existing email
        password: 'DupPassword123!',
      };
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(newUser)
        .expect(HttpStatus.CONFLICT)
        .expect((res) => {
          expect(res.body.message).toEqual(`User with email "${adminUser.email}" already exists.`);
        });
    });
  });

  describe('/users (GET)', () => {
    it('should allow admin to get all users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body).toBeArrayOfSize(3); // admin, regular, and one created above
          expect(res.body[0].password).not.toBeDefined();
        });
    });

    it('should prevent regular user from getting all users', async () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden resource');
        });
    });
  });

  describe('/users/:id (GET)', () => {
    it('should allow admin to get any user by ID', async () => {
      return request(app.getHttpServer())
        .get(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(regularUser.id);
          expect(res.body.email).toEqual(regularUser.email);
          expect(res.body.password).not.toBeDefined();
        });
    });

    it('should allow regular user to get their own profile by ID', async () => {
      return request(app.getHttpServer())
        .get(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.id).toEqual(regularUser.id);
        });
    });

    it('should prevent regular user from getting another user\'s profile by ID', async () => {
      return request(app.getHttpServer())
        .get(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden'); // Custom forbidden message from controller
        });
    });

    it('should return 404 for a non-existent user ID', async () => {
      const nonExistentId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`) // Admin access to ensure it's not a permission issue
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`User with ID "${nonExistentId}" not found.`);
        });
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should allow admin to update any user\'s name', async () => {
      const updateDto = { name: 'Updated Admin Name' };
      return request(app.getHttpServer())
        .patch(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.name).toEqual(updateDto.name);
        });
    });

    it('should allow admin to update any user\'s role', async () => {
      const updateDto = { roles: [UserRole.Admin, UserRole.User] };
      return request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.roles).toEqual([UserRole.Admin, UserRole.User]);
        });
    });

    it('should allow regular user to update their own name', async () => {
      const updateDto = { name: 'Updated Regular User Name' };
      return request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.OK)
        .expect((res) => {
          expect(res.body.name).toEqual(updateDto.name);
        });
    });

    it('should prevent regular user from updating another user\'s profile', async () => {
      const updateDto = { name: 'Attempted Change' };
      return request(app.getHttpServer())
        .patch(`/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden');
        });
    });

    it('should prevent regular user from updating their own roles', async () => {
      const updateDto = { roles: [UserRole.Admin] };
      return request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden');
        });
    });

    it('should return 404 for updating a non-existent user', async () => {
      const nonExistentId = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
      const updateDto = { name: 'Non Existent' };
      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateDto)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`User with ID "${nonExistentId}" not found.`);
        });
    });
  });

  describe('/users/:id (DELETE)', () => {
    let userToDelete: User;
    let userToDeleteAccessToken: string;

    beforeEach(async () => {
      // Create a new user for each delete test to ensure isolation
      const userRepository = dataSource.getRepository(User);
      userToDelete = await userRepository.save({
        name: 'Delete Test User',
        email: `delete_test_${Date.now()}@example.com`,
        password: await bcrypt.hash('DeletePassword123!', 10),
        roles: [UserRole.User],
      });
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: userToDelete.email, password: 'DeletePassword123!' });
      userToDeleteAccessToken = loginRes.body.accessToken;
    });

    it('should allow admin to delete any user', async () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should prevent regular user from deleting any user', async () => {
      return request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${regularUserAccessToken}`)
        .expect(HttpStatus.FORBIDDEN)
        .expect((res) => {
          expect(res.body.message).toEqual('Forbidden resource');
        });
    });

    it('should prevent a user from deleting their own account via this endpoint', async () => {
      // Though technically a regular user might want to delete their own account,
      // this endpoint is restricted to admin by `Roles(UserRole.Admin)`
      return request(app.getHttpServer())
        .delete(`/users/${userToDelete.id}`)
        .set('Authorization', `Bearer ${userToDeleteAccessToken}`)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('should return 404 when trying to delete a non-existent user', async () => {
      const nonExistentId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
      return request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(HttpStatus.NOT_FOUND)
        .expect((res) => {
          expect(res.body.message).toEqual(`User with ID "${nonExistentId}" not found.`);
        });
    });
  });
});
```