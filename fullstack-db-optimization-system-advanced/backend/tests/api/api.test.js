const request = require('supertest');
const app = require('@src/app');
const prisma = require('@config/db').default;
const jwt = require('jsonwebtoken');
const config = require('@config');
const { appCache } = require('@utils/cache');

describe('Overall API Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;
  let dbInstance;
  let slowQuery;
  let indexSuggestion;
  let schemaIssue;

  beforeAll(async () => {
    // Clear database
    await prisma.metricSnapshot.deleteMany();
    await prisma.queryExplanation.deleteMany();
    await prisma.monitoredQuery.deleteMany();
    await prisma.indexSuggestion.deleteMany();
    await prisma.schemaIssue.deleteMany();
    await prisma.dbInstance.deleteMany();
    await prisma.user.deleteMany();

    // Create admin user
    adminUser = await prisma.user.create({
      data: {
        username: 'adminuser',
        password: 'hashedpassword', // bcrypt('adminpassword', 10)
        role: 'admin',
      },
    });
    adminToken = jwt.sign({ id: adminUser.id }, config.jwt.secret, { expiresIn: '1h' });

    // Create regular user
    regularUser = await prisma.user.create({
      data: {
        username: 'testuser',
        password: 'hashedpassword', // bcrypt('testpassword', 10)
        role: 'user',
      },
    });
    userToken = jwt.sign({ id: regularUser.id }, config.jwt.secret, { expiresIn: '1h' });

    // Create DbInstance
    dbInstance = await prisma.dbInstance.create({
      data: {
        name: 'TestDbInstance',
        type: 'PostgreSQL',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
      },
    });

    // Create Slow Query
    slowQuery = await prisma.monitoredQuery.create({
      data: {
        dbInstanceId: dbInstance.id,
        queryText: 'SELECT * FROM expensive_table WHERE created_at < NOW() - INTERVAL \'1 day\';',
        durationMs: 2500,
        occurredAt: new Date(),
        hash: 'slow_query_hash',
      },
    });

    // Create Index Suggestion
    indexSuggestion = await prisma.indexSuggestion.create({
      data: {
        dbInstanceId: dbInstance.id,
        tableName: 'expensive_table',
        columns: ['created_at'],
        reason: 'Frequent filtering on created_at column.',
        queryIds: [slowQuery.id],
        status: 'pending',
      },
    });

    // Create Schema Issue
    schemaIssue = await prisma.schemaIssue.create({
      data: {
        dbInstanceId: dbInstance.id,
        issueType: 'MissingForeignKey',
        description: 'Table `orders` is missing FK to `products`.',
        objectName: 'orders',
        severity: 'high',
        status: 'open',
      },
    });

    // Create Metric Snapshot
    await prisma.metricSnapshot.create({
      data: {
        dbInstanceId: dbInstance.id,
        timestamp: new Date(),
        cpuUsage: 50.5,
        memoryUsage: 1024.0,
        activeConnections: 20,
      },
    });
  });

  afterAll(async () => {
    await prisma.metricSnapshot.deleteMany();
    await prisma.queryExplanation.deleteMany();
    await prisma.monitoredQuery.deleteMany();
    await prisma.indexSuggestion.deleteMany();
    await prisma.schemaIssue.deleteMany();
    await prisma.dbInstance.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
    appCache.flushAll(); // Clear any remaining cache
  });

  describe('Auth Flow', () => {
    it('should allow user login and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testuser', password: 'hashedpassword' }); // Use the placeholder password from before
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should protect /api/auth/me route', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      expect(res.statusCode).toBe(401);
    });

    it('should allow access to /api/auth/me with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.username).toBe('testuser');
    });
  });

  describe('Queries API', () => {
    it('should get slow queries for a DB instance', async () => {
      const res = await request(app)
        .get(`/api/queries/${dbInstance.id}?minDuration=1000`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(slowQuery.id);
    });
  });

  describe('Indexes API', () => {
    it('should get index suggestions for a DB instance', async () => {
      const res = await request(app)
        .get(`/api/indexes/${dbInstance.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(indexSuggestion.id);
    });

    it('should allow admin to update index suggestion status', async () => {
      const res = await request(app)
        .put(`/api/indexes/${dbInstance.id}/${indexSuggestion.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'applied' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('applied');
    });

    it('should prevent regular user from updating index suggestion status', async () => {
      const res = await request(app)
        .put(`/api/indexes/${dbInstance.id}/${indexSuggestion.id}/status`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ status: 'dismissed' });
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Forbidden: You do not have permission to access this resource');
    });
  });

  describe('Schemas API', () => {
    it('should get schema issues for a DB instance', async () => {
      const res = await request(app)
        .get(`/api/schemas/${dbInstance.id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].id).toBe(schemaIssue.id);
    });

    it('should allow admin to update schema issue status', async () => {
      const res = await request(app)
        .put(`/api/schemas/${dbInstance.id}/${schemaIssue.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('resolved');
    });
  });

  describe('Metrics API', () => {
    it('should get latest metrics for a DB instance', async () => {
      const res = await request(app)
        .get(`/api/metrics/${dbInstance.id}/latest`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('cpuUsage');
    });

    it('should get metric history for a DB instance', async () => {
      const res = await request(app)
        .get(`/api/metrics/${dbInstance.id}/history`)
        .set('Authorization', `Bearer ${userToken}`)
        .query({ startDate: new Date(Date.now() - 3600000).toISOString() }); // Last hour
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0]).toHaveProperty('memoryUsage');
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit auth login attempts', async () => {
      const originalMaxRequests = config.rateLimit.maxRequests;
      config.rateLimit.maxRequests = 2; // Temporarily lower for test

      for (let i = 0; i < 2; i++) { // Max 2 requests
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'nonexistent', password: 'wrongpassword' });
      }

      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'nonexistent', password: 'wrongpassword' });

      expect(res.statusCode).toBe(429);
      expect(res.body.message).toContain('Too many authentication attempts');

      // Reset config
      config.rateLimit.maxRequests = originalMaxRequests;
    }, 10000); // Increase timeout for rate limit test
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await request(app)
        .get('/api/unknown-route')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Route Not Found');
    });
  });
});
```

#### `performance-test.yml` (Artillery script for Performance Tests)
```yaml