const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const User = require('../../src/models/user.model');
const bcrypt = require('../../src/utils/bcrypt');
const jwt = require('../../src/utils/jwt');

describe('DB Connection API Integration Tests', () => {
    let adminToken;
    let userId;

    beforeAll(async () => {
        // Run migrations and seeds for the test database
        await db.migrate.latest();
        await db.seed.run();

        // Get admin user from seed data
        const adminUser = await User.findByUsername('admin');
        userId = adminUser.id;
        adminToken = jwt.generateToken({ id: adminUser.id, username: adminUser.username, role: adminUser.role });
    });

    afterAll(async () => {
        await db.migrate.rollback();
        await db.destroy();
    });

    beforeEach(async () => {
        // Clear db_connections table before each test to ensure isolation
        await db('db_connections').del();
    });

    const mockConnectionData = {
        name: 'test_db',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'test_user',
        password: 'test_password',
        database: 'test_database',
    };

    describe('POST /api/databases', () => {
        it('should create a new database connection', async () => {
            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);

            expect(res.statusCode).toEqual(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe(mockConnectionData.name);
            expect(res.body.data).not.toHaveProperty('password'); // Password should be encrypted and not returned
        });

        it('should return 409 if connection name already exists for the user', async () => {
            await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData); // First creation

            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData); // Second creation with same name

            expect(res.statusCode).toEqual(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Connection with name');
        });

        it('should return 401 if not authenticated', async () => {
            const res = await request(app)
                .post('/api/databases')
                .send(mockConnectionData);

            expect(res.statusCode).toEqual(401);
        });

        it('should return 400 for invalid input', async () => {
            const invalidData = { ...mockConnectionData, name: '' }; // Missing name
            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);

            expect(res.statusCode).toEqual(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Validation failed');
        });
    });

    describe('GET /api/databases', () => {
        it('should retrieve all database connections for the user', async () => {
            await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ ...mockConnectionData, name: 'another_db', database: 'another_db' });

            const res = await request(app)
                .get('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0]).not.toHaveProperty('password');
        });

        it('should return empty array if no connections exist', async () => {
            const res = await request(app)
                .get('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/databases/:id', () => {
        it('should retrieve a specific database connection by ID', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const getRes = await request(app)
                .get(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getRes.statusCode).toEqual(200);
            expect(getRes.body.status).toBe('success');
            expect(getRes.body.data.id).toBe(connectionId);
            expect(getRes.body.data.name).toBe(mockConnectionData.name);
        });

        it('should return 404 if connection not found or unauthorized', async () => {
            const getRes = await request(app)
                .get('/api/databases/99999') // Non-existent ID
                .set('Authorization', `Bearer ${adminToken}`);

            expect(getRes.statusCode).toEqual(404);
            expect(getRes.body.status).toBe('error');
            expect(getRes.body.message).toContain('not found');
        });
    });

    describe('PUT /api/databases/:id', () => {
        it('should update an existing database connection', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const updateData = { name: 'updated_db_name', host: 'new_host' };
            const putRes = await request(app)
                .put(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(putRes.statusCode).toEqual(200);
            expect(putRes.body.status).toBe('success');
            expect(putRes.body.data.id).toBe(connectionId);
            expect(putRes.body.data.name).toBe(updateData.name);
            expect(putRes.body.data.host).toBe(updateData.host);
        });

        it('should return 404 if connection not found for update', async () => {
            const updateData = { name: 'updated_db_name' };
            const putRes = await request(app)
                .put('/api/databases/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(putRes.statusCode).toEqual(404);
            expect(putRes.body.status).toBe('error');
        });

        it('should return 400 for invalid update input', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const invalidUpdateData = { name: '' }; // Invalid name
            const putRes = await request(app)
                .put(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidUpdateData);

            expect(putRes.statusCode).toEqual(400);
            expect(putRes.body.status).toBe('error');
        });
    });

    describe('DELETE /api/databases/:id', () => {
        it('should delete a database connection', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const deleteRes = await request(app)
                .delete(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.statusCode).toEqual(200);
            expect(deleteRes.body.status).toBe('success');
            expect(deleteRes.body.message).toContain('deleted successfully');

            // Verify it's actually deleted
            const getRes = await request(app)
                .get(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`);
            expect(getRes.statusCode).toEqual(404);
        });

        it('should return 404 if connection not found for deletion', async () => {
            const deleteRes = await request(app)
                .delete('/api/databases/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(deleteRes.statusCode).toEqual(404);
            expect(deleteRes.body.status).toBe('error');
        });
    });

    describe('POST /api/databases/:id/monitor/start & /stop', () => {
        it('should start monitoring for a connection', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const startRes = await request(app)
                .post(`/api/databases/${connectionId}/monitor/start`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(startRes.statusCode).toEqual(200);
            expect(startRes.body.status).toBe('success');
            expect(startRes.body.data.is_monitoring_active).toBe(true);
            expect(startRes.body.data.message).toContain('started');

            // Verify in DB
            const updatedConn = await db('db_connections').where({ id: connectionId }).first();
            expect(updatedConn.is_monitoring_active).toBe(true);
        });

        it('should stop monitoring for a connection', async () => {
            const createRes = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            // First start it
            await request(app)
                .post(`/api/databases/${connectionId}/monitor/start`)
                .set('Authorization', `Bearer ${adminToken}`);

            const stopRes = await request(app)
                .post(`/api/databases/${connectionId}/monitor/stop`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(stopRes.statusCode).toEqual(200);
            expect(stopRes.body.status).toBe('success');
            expect(stopRes.body.data.is_monitoring_active).toBe(false);
            expect(stopRes.body.data.message).toContain('stopped');

            // Verify in DB
            const updatedConn = await db('db_connections').where({ id: connectionId }).first();
            expect(updatedConn.is_monitoring_active).toBe(false);
        });

        it('should return 404 if connection not found for monitoring toggle', async () => {
            const res = await request(app)
                .post('/api/databases/99999/monitor/start')
                .set('Authorization', `Bearer ${adminToken}`);
            expect(res.statusCode).toEqual(404);
        });
    });
});