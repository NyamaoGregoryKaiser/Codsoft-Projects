```typescript
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import { getDb, initializeDatabase } from '../../src/database/db';
import authRoutes from '../../src/routes/auth.routes';
import { errorHandler } from '../../src/middleware/errorHandler';
import { UserRole } from '../../src/models/User';

// Mock logger to suppress console output during tests
jest.mock('../../src/utils/logger');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler); // Ensure error handling is applied

let db: any; // Using any for better-sqlite3 DB for simplicity in test

beforeAll(async () => {
  // Use a temporary in-memory database for tests
  process.env.DATA_DIR = './test_data'; // ensure data dir exists for sqlite to not fail
  process.env.DB_FILE = ':memory:'; // Use in-memory DB for tests
  await initializeDatabase();
  db = getDb();

  // Create test user schema and table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

afterEach(() => {
  // Clear users table after each test
  db.exec('DELETE FROM users');
});

afterAll(() => {
  // Close the database connection
  db.close();
});

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUser = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body.message).toEqual('User registered successfully');
      expect(res.body.userId).toBeDefined();

      const userInDb = db.prepare('SELECT * FROM users WHERE email = ?').get(newUser.email);
      expect(userInDb).toBeDefined();
      expect(userInDb.username).toEqual(newUser.username);
      expect(await bcrypt.compare(newUser.password, userInDb.password)).toBe(true);
    });

    it('should return 400 if required fields are missing', async () => {
      const incompleteUser = {
        username: 'testuser',
        email: 'test@example.com',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(incompleteUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    it('should return 409 if user with email already exists', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run('existing', 'existing@example.com', hashedPassword);

      const newUser = {
        username: 'anotheruser',
        email: 'existing@example.com', // Duplicate email
        password: 'newpassword',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(res.statusCode).toEqual(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('User with that email or username already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    const testUser = {
      username: 'loginuser',
      email: 'login@example.com',
      password: 'loginpassword',
    };
    let userId: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const result = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)').run(testUser.username, testUser.email, hashedPassword);
      userId = result.lastInsertRowid;
    });

    it('should login a user successfully and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: testUser.password });

      expect(res.statusCode).toEqual(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toEqual(testUser.email);
      expect(res.body.user.role).toEqual(UserRole.User);
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Missing required fields');
    });

    it('should return 401 for invalid credentials (wrong password)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Invalid credentials');
    });

    it('should return 401 for invalid credentials (user not found)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'anypassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Invalid credentials');
    });
  });

  describe('GET /api/auth/profile', () => {
    const testUser = {
      username: 'profileuser',
      email: 'profile@example.com',
      password: 'profilepassword',
      role: UserRole.Admin,
    };
    let token: string;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      const result = db.prepare('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)').run(testUser.username, testUser.email, hashedPassword, testUser.role);
      const userId = result.lastInsertRowid;
      token = request(app).post('/api/auth/login').send({ email: testUser.email, password: testUser.password })
        .then(res => res.body.token);
    });

    it('should return user profile for authenticated user', async () => {
      const userToken = await token;
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.username).toEqual(testUser.username);
      expect(res.body.email).toEqual(testUser.email);
      expect(res.body.role).toEqual(testUser.role);
      expect(res.body.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 401 if no token is provided', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Authentication token required');
    });

    it('should return 403 if token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.statusCode).toEqual(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Invalid or expired token');
    });
  });
});
```