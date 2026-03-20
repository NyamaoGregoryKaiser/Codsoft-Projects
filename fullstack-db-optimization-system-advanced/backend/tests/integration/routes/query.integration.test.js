const request = require('supertest');
const app = require('@src/app');
const prisma = require('@config/db').default;
const jwt = require('jsonwebtoken');
const config = require('@config');

describe('Query Routes (Integration)', () => {
  let token;
  let dbInstance;
  let slowQuery;
  let user;

  beforeAll(async () => {
    // Clean database before tests
    await prisma.queryExplanation.deleteMany();
    await prisma.monitoredQuery.deleteMany();
    await prisma.dbInstance.deleteMany();
    await prisma.user.deleteMany();

    // Create a test user
    user = await prisma.user.create({
      data: {
        username: 'querytestuser',
        password: 'hashedpassword',
        role: 'user',
      },
    });
    token = jwt.sign({ id: user.id }, config.jwt.secret, { expiresIn: '1h' });

    // Create a test DbInstance
    dbInstance = await prisma.dbInstance.create({
      data: {
        name: 'TestDB',
        type: 'PostgreSQL',
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'testuser',
      },
    });

    // Create a slow query
    slowQuery = await prisma.monitoredQuery.create({
      data: {
        dbInstanceId: dbInstance.id,
        queryText: 'SELECT * FROM big_table WHERE id = 1;',
        durationMs: 1500,
        occurredAt: new Date(),
        hash: 'test_hash_1',
      },
    });

    // Create an explanation for the slow query
    await prisma.queryExplanation.create({
      data: {
        monitoredQueryId: slowQuery.id,
        planType: 'Index Scan',
        cost: 10.5,
        rows: 1,
        actualTime: 0.2,
        loops: 1,
        detail: { 'index': 'idx_big_table_id' },
      },
    });

    // Create another faster query
    await prisma.monitoredQuery.create({
      data: {
        dbInstanceId: dbInstance.id,
        queryText: 'SELECT 1;',
        durationMs: 50,
        occurredAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        hash: 'test_hash_2',
      },
    });
  });

  afterAll(async () => {
    await prisma.queryExplanation.deleteMany();
    await prisma.monitoredQuery.deleteMany();
    await prisma.dbInstance.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('GET /api/queries/:dbInstanceId should return paginated slow queries', async () => {
    const res = await request(app)
      .get(`/api/queries/${dbInstance.id}?minDuration=1000&page=1&pageSize=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(slowQuery.id);
    expect(res.body.pagination.total).toBe(1);
  });

  it('GET /api/queries/:dbInstanceId should return 404 for non-existent dbInstanceId', async () => {
    const res = await request(app)
      .get(`/api/queries/nonexistent-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Database instance not found');
  });

  it('GET /api/queries/:dbInstanceId/:queryId should return a single query with explanations', async () => {
    const res = await request(app)
      .get(`/api/queries/${dbInstance.id}/${slowQuery.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(slowQuery.id);
    expect(res.body.data.queryText).toBe(slowQuery.queryText);
    expect(res.body.data.queryExplanation).toBeInstanceOf(Array);
    expect(res.body.data.queryExplanation.length).toBe(1);
  });

  it('GET /api/queries/:dbInstanceId/:queryId should return 404 for non-existent query', async () => {
    const res = await request(app)
      .get(`/api/queries/${dbInstance.id}/nonexistent-query-id`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Monitored query not found for this instance');
  });

  it('GET /api/queries/:dbInstanceId/:queryId/explanations should return explanations', async () => {
    const res = await request(app)
      .get(`/api/queries/${dbInstance.id}/${slowQuery.id}/explanations`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0]).toHaveProperty('planType');
  });

  it('should require authentication for all query routes', async () => {
    const res = await request(app)
      .get(`/api/queries/${dbInstance.id}`);
    expect(res.statusCode).toEqual(401);

    const res2 = await request(app)
      .get(`/api/queries/${dbInstance.id}/${slowQuery.id}`);
    expect(res2.statusCode).toEqual(401);

    const res3 = await request(app)
      .get(`/api/queries/${dbInstance.id}/${slowQuery.id}/explanations`);
    expect(res3.statusCode).toEqual(401);
  });
});
```

#### `backend/tests/api/api.test.js`
```javascript