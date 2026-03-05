const request = require('supertest');
const app = require('../../app');
const knex = require('../../db/knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { encrypt, decrypt } = require('../../utils/encryption');

describe('Connections API Integration Tests', () => {
  let user;
  let userToken;
  let adminToken; // Not strictly needed for user connections, but good for context

  beforeEach(async () => {
    // Clear tables and seed users
    await knex('connections').del();
    await knex('users').del();

    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const [createdUser] = await knex('users').insert({
      username: 'testuser',
      email: 'test@example.com',
      password_hash: hashedPassword,
      role: 'user',
    }).returning('*');
    user = createdUser;
    userToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const [adminUser] = await knex('users').insert({
      username: 'admin',
      email: 'admin@test.com',
      password_hash: hashedPassword, // Re-use hashedPassword
      role: 'admin',
    }).returning('*');
    adminToken = jwt.sign({ id: adminUser.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  const connectionData = {
    name: 'My Test DB',
    host: 'localhost',
    port: 5432,
    user: 'testuser_db',
    password: 'dbpassword',
    database: 'test_db',
  };

  describe('POST /api/connections', () => {
    test('should create a new connection for the authenticated user', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${userToken}`)
        .send(connectionData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.name).toBe(connectionData.name);
      expect(res.body.user_id).toBe(user.id);
      expect(res.body).not.toHaveProperty('password'); // Password should be encrypted and not returned

      const connInDb = await knex('connections').where({ id: res.body.id }).first();
      expect(connInDb).toBeDefined();
      expect(connInDb.user_id).toBe(user.id);
      expect(decrypt(connInDb.password)).toBe(connectionData.password);
    });

    test('should return 400 for missing connection fields', async () => {
      const incompleteData = { ...connectionData, name: undefined };
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${userToken}`)
        .send(incompleteData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toBe('Please provide all connection details');
    });

    test('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/connections')
        .send(connectionData);
      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /api/connections', () => {
    test('should fetch all connections for the authenticated user', async () => {
      await knex('connections').insert({
        user_id: user.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      });
      // Add a connection for a different user
      const [otherUser] = await knex('users').insert({ username: 'other', email: 'other@example.com', password_hash: 'hash', role: 'user' }).returning('id');
      await knex('connections').insert({
        user_id: otherUser.id,
        name: 'Other DB',
        host: 'otherhost',
        port: 5432,
        user: 'otheruser',
        password: encrypt('otherpass'),
        database: 'other_db',
      });

      const res = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe(connectionData.name);
      expect(res.body[0]).not.toHaveProperty('password');
    });
  });

  describe('GET /api/connections/:id', () => {
    test('should fetch a specific connection by ID for the owner', async () => {
      const [conn] = await knex('connections').insert({
        user_id: user.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const res = await request(app)
        .get(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(conn.id);
      expect(res.body.name).toBe(connectionData.name);
      expect(res.body).not.toHaveProperty('password');
    });

    test('should return 404 if connection not found', async () => {
      const res = await request(app)
        .get('/api/connections/99999')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Connection not found');
    });

    test('should return 403 if user does not own the connection', async () => {
      const [otherUser] = await knex('users').insert({ username: 'other', email: 'other2@example.com', password_hash: 'hash', role: 'user' }).returning('id');
      const [conn] = await knex('connections').insert({
        user_id: otherUser.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const res = await request(app)
        .get(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Not authorized to view this connection');
    });
  });

  describe('PUT /api/connections/:id', () => {
    test('should update a specific connection for the owner', async () => {
      const [conn] = await knex('connections').insert({
        user_id: user.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const updatedName = 'Updated DB Name';
      const res = await request(app)
        .put(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: updatedName, password: 'new_db_password' }); // Test password update too

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toBe(conn.id);
      expect(res.body.name).toBe(updatedName);
      expect(res.body).not.toHaveProperty('password');

      const connInDb = await knex('connections').where({ id: conn.id }).first();
      expect(connInDb.name).toBe(updatedName);
      expect(decrypt(connInDb.password)).toBe('new_db_password');
    });

    test('should return 403 if user does not own the connection', async () => {
      const [otherUser] = await knex('users').insert({ username: 'other', email: 'other3@example.com', password_hash: 'hash', role: 'user' }).returning('id');
      const [conn] = await knex('connections').insert({
        user_id: otherUser.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const res = await request(app)
        .put(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Attempted Update' });
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Connection not found or not authorized');
    });
  });

  describe('DELETE /api/connections/:id', () => {
    test('should delete a specific connection for the owner', async () => {
      const [conn] = await knex('connections').insert({
        user_id: user.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const res = await request(app)
        .delete(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Connection deleted successfully');

      const connInDb = await knex('connections').where({ id: conn.id }).first();
      expect(connInDb).toBeUndefined();
    });

    test('should return 403 if user does not own the connection', async () => {
      const [otherUser] = await knex('users').insert({ username: 'other', email: 'other4@example.com', password_hash: 'hash', role: 'user' }).returning('id');
      const [conn] = await knex('connections').insert({
        user_id: otherUser.id,
        ...connectionData,
        password: encrypt(connectionData.password),
      }).returning('id');

      const res = await request(app)
        .delete(`/api/connections/${conn.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('Connection not found or not authorized');
    });
  });

  describe('GET /api/connections/:id/test', () => {
    // This test actually requires a running PostgreSQL instance accessible from the test environment.
    // For a real integration test, you would mock 'pg.Client.connect' and 'pg.Client.query'.
    // Here, we'll assume a local PostgreSQL is available at DB_HOST:DB_PORT
    // and provide dummy data that *would* connect if valid.
    test('should return success for a valid connection (mocked/dummy)', async () => {
      // Create a connection in DBTune's DB with valid (but potentially unreachable from test runner) credentials
      // For this test, we'll use credentials for DBTune's own test database, which is running for Jest setup.
      const dbTuneTestConnection = {
        name: 'DBTune Test Connection',
        host: process.env.TEST_DB_HOST || 'localhost', // Use test DB host
        port: process.env.TEST_DB_PORT || 5433,
        user: process.env.TEST_DB_USER || 'dbtune_test_user',
        password: process.env.TEST_DB_PASSWORD || 'test_password',
        database: process.env.TEST_DB_NAME || 'dbtune_test',
      };

      const [conn] = await knex('connections').insert({
        user_id: user.id,
        ...dbTuneTestConnection,
        password: encrypt(dbTuneTestConnection.password),
      }).returning('id');

      const res = await request(app)
        .get(`/api/connections/${conn.id}/test`)
        .set('Authorization', `Bearer ${userToken}`);

      // If the test DB is running and accessible, this should pass.
      // If it fails, it usually means the test runner can't reach the specified host:port for the target DB.
      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe('Connection successful!');
    });

    test('should return 500 for an invalid connection (mocked/dummy)', async () => {
      const invalidConnection = {
        name: 'Invalid Test DB',
        host: 'nonexistent-host', // Should fail to connect
        port: 5432,
        user: 'baduser',
        password: 'badpassword',
        database: 'baddb',
      };

      const [conn] = await knex('connections').insert({
        user_id: user.id,
        ...invalidConnection,
        password: encrypt(invalidConnection.password),
      }).returning('id');

      const res = await request(app)
        .get(`/api/connections/${conn.id}/test`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(500);
      expect(res.body.message).toContain('Failed to connect to target database:');
    });
  });
});