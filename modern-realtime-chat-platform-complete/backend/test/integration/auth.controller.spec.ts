import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../src/users/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { setupTestEnvironment } from '../test-utils/setup-test-environment'; // Helper for test DB setup

describe('AuthController (Integration)', () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let configService: ConfigService;

  const testUserPassword = 'testpassword123';
  const testUserHashedPassword = bcrypt.hashSync(testUserPassword, 10);

  const mockUser: User = {
    id: 'test-user-id',
    username: 'integrationtest',
    email: 'integration@example.com',
    password: testUserHashedPassword,
    avatar: 'avatar.png',
    createdAt: new Date(),
    updatedAt: new Date(),
    roomMembers: [],
    messages: [],
    createdRooms: [],
  };

  beforeAll(async () => {
    // Dynamically configure the AppModule for testing
    const { moduleFixture, testingApp } = await setupTestEnvironment();
    app = testingApp;

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init(); // Initialize the NestJS application

    // Clear and seed test database
    await userRepository.clear();
    await userRepository.save(mockUser);
  });

  afterAll(async () => {
    await userRepository.clear();
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const newUser = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'securepassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(newUser)
        .expect(201); // Created

      expect(response.body).toEqual(
        expect.objectContaining({
          username: newUser.username,
          email: newUser.email,
          id: expect.any(String),
        }),
      );
      expect(response.body).not.toHaveProperty('password'); // Password should not be returned

      const registeredUser = await userRepository.findOne({ where: { username: newUser.username } });
      expect(registeredUser).toBeDefined();
      expect(await bcrypt.compare(newUser.password, registeredUser.password)).toBe(true);
    });

    it('should return 400 if username already exists', async () => {
      const existingUser = {
        username: mockUser.username,
        email: 'another@example.com',
        password: 'somepassword',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(existingUser)
        .expect(400); // Bad Request (due to ValidationPipe)
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ username: 'short', email: 'a@b.com', password: '123' }) // Too short password
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should log in an existing user and return a JWT', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: mockUser.username, password: testUserPassword })
        .expect(201);

      expect(response.body).toHaveProperty('access_token');
      const token = response.body.access_token;

      // Verify token content
      const decoded = jwtService.verify(token, { secret: configService.get<string>('JWT_SECRET') });
      expect(decoded.username).toBe(mockUser.username);
      expect(decoded.sub).toBe(mockUser.id);
    });

    it('should return 401 for invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: mockUser.username, password: 'wrongpassword' })
        .expect(401); // Unauthorized
    });

    it('should return 401 for non-existent user', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: 'nonexistent', password: 'anypassword' })
        .expect(401);
    });
  });

  describe('/auth/profile (GET)', () => {
    let accessToken: string;

    beforeAll(async () => {
      // Log in to get a valid token
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: mockUser.username, password: testUserPassword });
      accessToken = loginResponse.body.access_token;
    });

    it('should return the profile of the authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
        }),
      );
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 if no token is provided', async () => {
      await request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 if an invalid token is provided', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });
  });
});