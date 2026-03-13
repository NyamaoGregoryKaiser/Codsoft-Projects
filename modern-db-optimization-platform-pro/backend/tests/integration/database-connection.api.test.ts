```typescript
import request from 'supertest';
import app from '../../src/app';
import { AppDataSource } from '../../src/data-source';
import { User } from '../../src/users/user.entity';
import { DatabaseConnection } from '../../src/database-connections/database-connection.entity';
import bcrypt from 'bcrypt';
import { UserRole } from '../../src/shared/enums';
import { Repository } from 'typeorm';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';

describe('Database Connection API Integration Tests', () => {
  let userRepository: Repository<User>;
  let connectionRepository: Repository<DatabaseConnection>;
  let testUser: User;
  let testUserToken: string;
  const testUserPassword = 'testpassword123';

  beforeAll(async () => {
    await AppDataSource.synchronize(true); // Re-sync schema for clean slate in tests
    userRepository = AppDataSource.getRepository(User);
    connectionRepository = AppDataSource.getRepository(DatabaseConnection);

    // Create a test user
    const hashedPassword = await bcrypt.hash(testUserPassword, 10);
    testUser = userRepository.create({
      username: 'db_conn_user',
      password: hashedPassword,
      role: UserRole.USER,
    });
    await userRepository.save(testUser);

    // Generate token for the test user
    testUserToken = jwt.sign(
      { id: testUser.id, username: testUser.username, role: testUser.role },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
  });

  beforeEach(async () => {
    // Clear connections before each test to ensure test isolation
    await connectionRepository.delete({});
  });

  afterAll(async () => {
    await connectionRepository.delete({});
    await userRepository.delete({}); // Clean up test user
  });

  describe('POST /api/connections', () => {
    it('should create a new database connection', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'My Test DB',
          host: 'localhost',
          port: 5432,
          dbName: 'mydb',
          dbUser: 'myuser',
          dbPassword: 'mypassword',
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toEqual('My Test DB');

      const connectionInDb = await connectionRepository.findOne({ where: { name: 'My Test DB', userId: testUser.id }, select: ['dbPasswordEncrypted'] });
      expect(connectionInDb).not.toBeNull();
      if (connectionInDb) {
        // Password is encrypted, so we can't compare directly, but ensure it's not the plain text
        expect(connectionInDb.dbPasswordEncrypted).not.toEqual('mypassword');
      }
    });

    it('should return 400 for invalid connection data', async () => {
      const res = await request(app)
        .post('/api/connections')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: '', // Invalid: empty name
          host: 'localhost',
          port: 5432,
          dbName: 'mydb',
          dbUser: 'myuser',
          dbPassword: 'mypassword',
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Validation failed');
      expect(res.body.errors).toContain('body.name - Name is required');
    });

    it('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/connections')
        .send({
          name: 'My Test DB',
          host: 'localhost',
          port: 5432,
          dbName: 'mydb',
          dbUser: 'myuser',
          dbPassword: 'mypassword',
        });

      expect(res.statusCode).toEqual(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Not authorized, no token');
    });
  });

  describe('GET /api/connections', () => {
    it('should return all connections for the authenticated user', async () => {
      await connectionRepository.save(
        connectionRepository.create({
          userId: testUser.id,
          name: 'Conn 1', host: 'h1', port: 1111, dbName: 'd1', dbUser: 'u1', dbPasswordEncrypted: await bcrypt.hash('p1', 10),
        })
      );
      await connectionRepository.save(
        connectionRepository.create({
          userId: testUser.id,
          name: 'Conn 2', host: 'h2', port: 2222, dbName: 'd2', dbUser: 'u2', dbPasswordEncrypted: await bcrypt.hash('p2', 10),
        })
      );

      const res = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].name).toEqual('Conn 1');
      expect(res.body.data[1].name).toEqual('Conn 2');
    });

    it('should return an empty array if no connections exist for the user', async () => {
      const res = await request(app)
        .get('/api/connections')
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe('PUT /api/connections/:id', () => {
    let existingConnection: DatabaseConnection;

    beforeEach(async () => {
      existingConnection = await connectionRepository.save(
        connectionRepository.create({
          userId: testUser.id,
          name: 'Old Name', host: 'old_host', port: 1234, dbName: 'old_db', dbUser: 'old_user', dbPasswordEncrypted: await bcrypt.hash('old_pass', 10),
        })
      );
    });

    it('should update an existing connection', async () => {
      const res = await request(app)
        .put(`/api/connections/${existingConnection.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          name: 'New Name',
          host: 'new_host',
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toEqual('New Name');
      expect(res.body.data.host).toEqual('new_host');

      const updatedConnection = await connectionRepository.findOneBy({ id: existingConnection.id });
      expect(updatedConnection?.name).toEqual('New Name');
      expect(updatedConnection?.host).toEqual('new_host');
    });

    it('should update password if provided', async () => {
      const newPassword = 'new_strong_password';
      const res = await request(app)
        .put(`/api/connections/${existingConnection.id}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({
          dbPassword: newPassword,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      const updatedConnection = await connectionRepository.findOne({ where: { id: existingConnection.id }, select: ['dbPasswordEncrypted'] });
      expect(updatedConnection?.dbPasswordEncrypted).not.toEqual('old_pass');
      expect(updatedConnection?.dbPasswordEncrypted).not.toEqual(newPassword);
      // In real scenario, would decrypt and assert or use an encrypted helper.
      // For this test, just check it changed.
      expect(updatedConnection?.dbPasswordEncrypted).not.toEqual(existingConnection.dbPasswordEncrypted);
    });

    it('should return 404 if connection not found or unauthorized', async () => {
      const res = await request(app)
        .put(`/api/connections/non-existent-uuid`) // Use a valid UUID format
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ name: 'Attempted Update' });

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Database connection not found or unauthorized');
    });
  });

  describe('DELETE /api/connections/:id', () => {
    let connectionToDelete: DatabaseConnection;

    beforeEach(async () => {
      connectionToDelete = await connectionRepository.save(
        connectionRepository.create({
          userId: testUser.id,
          name: 'To Be Deleted', host: 'del_host', port: 9999, dbName: 'del_db', dbUser: 'del_user', dbPasswordEncrypted: await bcrypt.hash('del_pass', 10),
        })
      );
    });

    it('should delete a connection', async () => {
      const res = await request(app)
        .delete(`/api/connections/${connectionToDelete.id}`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(204);
      expect(res.body.success).toBe(true); // Assuming 204 still returns success:true based on error handler

      const deletedConnection = await connectionRepository.findOneBy({ id: connectionToDelete.id });
      expect(deletedConnection).toBeNull();
    });

    it('should return 404 if connection not found or unauthorized', async () => {
      const res = await request(app)
        .delete(`/api/connections/non-existent-uuid`)
        .set('Authorization', `Bearer ${testUserToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toEqual('Database connection not found or unauthorized');
    });
  });
});
```