const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/db');
const User = require('../../src/models/user.model');
const jwt = require('../../src/utils/jwt');
const { encrypt, decrypt } = require('../../src/utils/encryption');

// Mock `monitoringQueue` to prevent actual job scheduling during API tests
jest.mock('../../src/jobs/queue', () => ({
    monitoringQueue: {
        add: jest.fn(),
        removeRepeatable: jest.fn(),
        on: jest.fn(),
    },
}));

describe('DB Connection API (API Tests)', () => {
    let adminToken;
    let userId;

    beforeAll(async () => {
        await db.migrate.latest();
        await db.seed.run(); // Seeds an admin user

        const adminUser = await User.findByUsername('admin');
        userId = adminUser.id;
        adminToken = jwt.generateToken({ id: adminUser.id, username: adminUser.username, role: adminUser.role });
    });

    afterAll(async () => {
        await db.migrate.rollback();
        await db.destroy();
    });

    beforeEach(async () => {
        // Clear all db_connections before each test
        await db('db_connections').del();
        jest.clearAllMocks(); // Clear mocks for monitoringQueue
    });

    const mockConnectionData = {
        name: 'Test_Postgres',
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'pguser',
        password: 'pgpassword',
        database: 'testdb',
    };

    describe('POST /api/databases', () => {
        it('should create a new database connection successfully', async () => {
            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);

            expect(res.statusCode).toBe(201);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.name).toBe(mockConnectionData.name);
            expect(res.body.data).not.toHaveProperty('password'); // Password should not be returned
        });

        it('should return 400 for invalid connection data', async () => {
            const invalidData = { ...mockConnectionData, host: '' };
            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(invalidData);

            expect(res.statusCode).toBe(400);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('Validation failed');
        });

        it('should return 409 if a connection with the same name already exists for the user', async () => {
            await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData);

            const res = await request(app)
                .post('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(mockConnectionData); // Send again

            expect(res.statusCode).toBe(409);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('already exists');
        });
    });

    describe('GET /api/databases', () => {
        it('should retrieve all connections for the authenticated user', async () => {
            await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send({ ...mockConnectionData, name: 'Another_DB', database: 'anotherdb' });

            const res = await request(app)
                .get('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveLength(2);
            expect(res.body.data[0]).not.toHaveProperty('password');
        });

        it('should return an empty array if no connections exist', async () => {
            const res = await request(app)
                .get('/api/databases')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data).toHaveLength(0);
        });
    });

    describe('GET /api/databases/:id', () => {
        it('should retrieve a specific connection by ID', async () => {
            const createRes = await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const res = await request(app)
                .get(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.id).toBe(connectionId);
            expect(res.body.data.name).toBe(mockConnectionData.name);
            expect(res.body.data).not.toHaveProperty('password');
        });

        it('should return 404 if connection not found or not owned by user', async () => {
            const res = await request(app)
                .get('/api/databases/99999') // Non-existent ID
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe('error');
            expect(res.body.message).toContain('not found');
        });
    });

    describe('PUT /api/databases/:id', () => {
        it('should update an existing connection', async () => {
            const createRes = await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const updateData = { name: 'Updated_Name', host: 'newhost.com', password: 'new_password' };
            const res = await request(app)
                .put(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.id).toBe(connectionId);
            expect(res.body.data.name).toBe(updateData.name);
            expect(res.body.data.host).toBe(updateData.host);
            expect(res.body.data).not.toHaveProperty('password'); // Password still not returned

            // Verify password actually updated and encrypted in DB
            const dbConn = await db('db_connections').where({ id: connectionId }).first();
            expect(decrypt(dbConn.password)).toBe(updateData.password);
        });

        it('should return 404 if connection not found for update', async () => {
            const res = await request(app)
                .put('/api/databases/99999')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ name: 'NonExistent' });

            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe('error');
        });
    });

    describe('DELETE /api/databases/:id', () => {
        it('should delete a connection', async () => {
            const createRes = await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const res = await request(app)
                .delete(`/api/databases/${connectionId}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.message).toContain('deleted successfully');

            const checkDb = await db('db_connections').where({ id: connectionId }).first();
            expect(checkDb).toBeUndefined();
        });

        it('should return 404 if connection not found for deletion', async () => {
            const res = await request(app)
                .delete('/api/databases/99999')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(404);
            expect(res.body.status).toBe('error');
        });
    });

    describe('POST /api/databases/:id/monitor/start', () => {
        it('should set monitoring to active and add job to queue', async () => {
            const createRes = await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            const connectionId = createRes.body.data.id;

            const res = await request(app)
                .post(`/api/databases/${connectionId}/monitor/start`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.is_monitoring_active).toBe(true);
            expect(res.body.data.message).toContain('started');
            expect(require('../../src/jobs/queue').monitoringQueue.add).toHaveBeenCalledTimes(1);

            const dbConn = await db('db_connections').where({ id: connectionId }).first();
            expect(dbConn.is_monitoring_active).toBe(true);
        });
    });

    describe('POST /api/databases/:id/monitor/stop', () => {
        it('should set monitoring to inactive and remove job from queue', async () => {
            // First create and set to active
            const createRes = await request(app).post('/api/databases').set('Authorization', `Bearer ${adminToken}`).send(mockConnectionData);
            const connectionId = createRes.body.data.id;
            await db('db_connections').where({ id: connectionId }).update({ is_monitoring_active: true });

            const res = await request(app)
                .post(`/api/databases/${connectionId}/monitor/stop`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.status).toBe('success');
            expect(res.body.data.is_monitoring_active).toBe(false);
            expect(res.body.data.message).toContain('stopped');
            expect(require('../../src/jobs/queue').monitoringQueue.removeRepeatable).toHaveBeenCalledTimes(1);

            const dbConn = await db('db_connections').where({ id: connectionId }).first();
            expect(dbConn.is_monitoring_active).toBe(false);
        });
    });
});