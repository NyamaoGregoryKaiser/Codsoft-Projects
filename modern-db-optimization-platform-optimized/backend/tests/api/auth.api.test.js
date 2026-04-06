const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const User = require('../../src/models/user.model');
const jwt = require('../../src/utils/jwt');

describe('Auth API', () => {
    beforeAll(async () => {
        await db.migrate.latest(); // Ensure migrations are run
    });

    afterAll(async () => {
        await db.migrate.rollback(); // Rollback migrations to clean up
        await db.destroy(); // Close database connection
    });

    beforeEach(async () => {
        await db('users').del(); // Clear users table before each test
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'password123',
                });

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.username).toBe('testuser');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).not.toHaveProperty('password'); // Password should not be returned

            const userInDb = await User.findByUsername('testuser');
            expect(userInDb).toBeDefined();
            expect(userInDb.email).toBe('test@example.com');
            expect(userInDb.password).not.toBe('password123'); // Password should be hashed
        });

        it('should return 409 if username already exists', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ username: 'existinguser', email: 'one@example.com', password: 'password123' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'existinguser', email: 'two@example.com', password: 'password456' });

            expect(res.statusCode).toEqual(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Username already taken');
        });

        it('should return 409 if email already exists', async () => {
            await request(app)
                .post('/api/auth/register')
                .send({ username: 'userone', email: 'existing@example.com', password: 'password123' });

            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'usertwo', email: 'existing@example.com', password: 'password456' });

            expect(res.statusCode).toEqual(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Email already registered');
        });

        it('should return 400 for invalid input', async () => {
            const res = await request(app)
                .post('/api/auth/register')
                .send({ username: 'ab', email: 'invalid-email', password: '123' }); // Too short username, invalid email, too short password

            expect(res.statusCode).toEqual(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Validation failed');
            expect(res.body.errors).toHaveLength(3);
        });
    });

    describe('POST /api/auth/login', () => {
        let registeredUser;
        let hashedPassword;

        beforeEach(async () => {
            await db('users').del(); // Clear users before this suite
            hashedPassword = await require('../../src/utils/bcrypt').hashPassword('securepassword');
            registeredUser = await User.create({
                username: 'loginuser',
                email: 'login@example.com',
                password: hashedPassword,
            });
        });

        it('should log in a registered user successfully', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'securepassword',
                });

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('user');
            expect(res.body.data.user.username).toBe('loginuser');
            expect(res.body.data).toHaveProperty('token');
            expect(res.body.data.user).not.toHaveProperty('password');
        });

        it('should return 401 for incorrect password', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'loginuser',
                    password: 'wrongpassword',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Invalid username or password.');
        });

        it('should return 401 for non-existent username', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'securepassword',
                });

            expect(res.statusCode).toEqual(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Invalid username or password.');
        });

        it('should return 400 for invalid input', async () => {
            const res = await request(app)
                .post('/api/auth/login')
                .send({
                    username: '', // Missing username
                    password: 'securepassword',
                });

            expect(res.statusCode).toEqual(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Validation failed');
            expect(res.body.errors).toHaveLength(1);
        });
    });

    describe('GET /api/auth/profile', () => {
        let validToken;
        let registeredUser;

        beforeEach(async () => {
            await db('users').del();
            const hashedPassword = await require('../../src/utils/bcrypt').hashPassword('securepassword');
            registeredUser = await User.create({
                username: 'profileuser',
                email: 'profile@example.com',
                password: hashedPassword,
            });
            validToken = jwt.generateToken({ id: registeredUser.id, username: registeredUser.username, role: registeredUser.role });
        });

        it('should return user profile for authenticated user', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${validToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.username).toBe('profileuser');
            expect(res.body.data.email).toBe('profile@example.com');
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('should return 401 if no token is provided', async () => {
            const res = await request(app)
                .get('/api/auth/profile');

            expect(res.statusCode).toEqual(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('No token provided.');
        });

        it('should return 401 if token is invalid', async () => {
            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', 'Bearer invalidtoken');

            expect(res.statusCode).toEqual(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Invalid token.');
        });

        it('should return 401 if token is expired', async () => {
            const expiredToken = jwt.sign({ id: 1, username: 'expired', role: 'user' }, require('../../src/config').jwt.secret, { expiresIn: '0s' });

            const res = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${expiredToken}`);

            expect(res.statusCode).toEqual(401);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Token expired.');
        });
    });
});