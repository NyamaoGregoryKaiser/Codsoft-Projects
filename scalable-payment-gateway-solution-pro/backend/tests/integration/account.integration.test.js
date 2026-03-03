const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { db } = require('../../src/config/db');
const userService = require('../../src/modules/users/user.service');
const authService = require('../../src/modules/auth/auth.service');

describe('Account routes', () => {
  let newUser;
  let userTokens;
  let userAccount;

  beforeAll(async () => {
    // Clear test database and seed fresh data
    await db('payments').del();
    await db('transactions').del();
    await db('accounts').del();
    await db('users').del();

    newUser = await userService.createUser({
      firstName: 'Test',
      lastName: 'User',
      email: 'testuser@example.com',
      password: 'Password123!',
    });
    userTokens = await authService.generateAuthTokens(newUser);
  });

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/v1/accounts', () => {
    it('should create a new USD account for authenticated user', async () => {
      const res = await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .send({ currency: 'USD' })
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('user_id', newUser.id);
      expect(res.body).toHaveProperty('currency', 'USD');
      expect(res.body).toHaveProperty('balance', '0.00'); // Knex returns decimal as string
      expect(res.body).toHaveProperty('account_number');
      userAccount = res.body; // Store for later tests
    });

    it('should return 400 if user tries to create a duplicate currency account', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .send({ currency: 'USD' })
        .expect(httpStatus.BAD_REQUEST);
    });

    it('should return 401 if unauthenticated', async () => {
      await request(app)
        .post('/api/v1/accounts')
        .send({ currency: 'GBP' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/accounts', () => {
    it('should retrieve all accounts for the authenticated user', async () => {
      // Create another account for the user
      await request(app)
        .post('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .send({ currency: 'EUR' })
        .expect(httpStatus.CREATED);

      const res = await request(app)
        .get('/api/v1/accounts')
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .expect(httpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(2);
      expect(res.body[0].user_id).toBe(newUser.id);
    });

    it('should return 401 if unauthenticated', async () => {
      await request(app)
        .get('/api/v1/accounts')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /api/v1/accounts/:accountId', () => {
    it('should retrieve a specific account by ID for the authenticated user', async () => {
      const res = await request(app)
        .get(`/api/v1/accounts/${userAccount.id}`)
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('id', userAccount.id);
      expect(res.body).toHaveProperty('user_id', newUser.id);
      expect(res.body).toHaveProperty('currency', userAccount.currency);
    });

    it('should return 404 if account not found', async () => {
      await request(app)
        .get(`/api/v1/accounts/${userAccount.id + 999}`) // Non-existent ID
        .set('Authorization', `Bearer ${userTokens.access.token}`)
        .expect(httpStatus.NOT_FOUND);
    });

    it('should return 404 if account not owned by user', async () => {
        // Create an account for a different user
        const anotherUser = await userService.createUser({
            firstName: 'Another',
            lastName: 'User',
            email: 'another@example.com',
            password: 'Password123!',
        });
        const [anotherAccount] = await db('accounts').insert({
            user_id: anotherUser.id,
            account_number: 'ACC-ANOTHER-USD-001',
            balance: 100.00,
            currency: 'USD',
        }).returning('id');

        await request(app)
            .get(`/api/v1/accounts/${anotherAccount.id}`)
            .set('Authorization', `Bearer ${userTokens.access.token}`) // Authenticated as newUser
            .expect(httpStatus.NOT_FOUND); // Should not find it because it's not newUser's
    });

    it('should return 401 if unauthenticated', async () => {
      await request(app)
        .get(`/api/v1/accounts/${userAccount.id}`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});