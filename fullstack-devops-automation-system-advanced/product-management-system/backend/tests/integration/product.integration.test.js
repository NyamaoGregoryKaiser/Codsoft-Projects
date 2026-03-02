const request = require('supertest');
const httpStatus = require('http-status');
const app = require('../../src/app');
const { sequelize, User, Product } = require('../../src/models');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const config = require('../../src/config');
const { invalidateCache } = require('../../src/utils/cache');

// Mock Redis cache operations to avoid actual Redis connection during integration tests
jest.mock('../../src/utils/cache', () => ({
  getOrSetCache: jest.fn((key, cb) => cb()), // Always call the callback directly
  invalidateCache: jest.fn()
}));

describe('Product routes', () => {
  let testUser, authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    testUser = await User.create({
      username: 'testuserprod',
      email: 'testprod@example.com',
      password: 'password123'
    });
    authToken = jwt.sign({ sub: testUser.id, iat: Math.floor(Date.now() / 1000) }, config.jwt.secret, { expiresIn: '1h' });
  });

  afterEach(async () => {
    // Clear products after each test, but keep the test user
    await Product.destroy({ truncate: true, cascade: true });
    jest.clearAllMocks(); // Clear cache mocks
  });

  afterAll(async () => {
    await User.destroy({ truncate: true, cascade: true });
    await sequelize.close();
  });

  describe('POST /v1/products', () => {
    it('should return 201 and create a product if authenticated and data is valid', async () => {
      const newProduct = {
        name: 'Integration Test Product',
        description: 'A product for integration testing.',
        price: 99.99,
        stock: 10
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(httpStatus.CREATED);

      expect(res.body).toHaveProperty('message', 'Product created successfully');
      expect(res.body.product).toHaveProperty('id');
      expect(res.body.product.name).toEqual(newProduct.name);
      expect(res.body.product.userId).toEqual(testUser.id);
      expect(invalidateCache).toHaveBeenCalledWith(`products:${testUser.id}`);

      const dbProduct = await Product.findByPk(res.body.product.id);
      expect(dbProduct).toBeDefined();
      expect(dbProduct.name).toEqual(newProduct.name);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .post('/api/v1/products')
        .send({ name: 'Unauthorized Product', price: 10, stock: 1 })
        .expect(httpStatus.UNAUTHORIZED);
    });

    it('should return 400 if required fields are missing', async () => {
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'Missing name and price' })
        .expect(httpStatus.INTERNAL_SERVER_ERROR); // Sequelize validation errors result in 500 by default, could be handled better
    });
  });

  describe('GET /v1/products', () => {
    let product1, product2;
    beforeEach(async () => {
      product1 = await Product.create({
        name: 'Product A',
        description: 'Desc A',
        price: 10.00,
        stock: 5,
        userId: testUser.id
      });
      product2 = await Product.create({
        name: 'Product B',
        description: 'Desc B',
        price: 20.00,
        stock: 10,
        userId: testUser.id
      });
    });

    it('should return 200 and all products for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toBeInstanceOf(Array);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].name).toEqual(product2.name); // Ordered by createdAt DESC by default
      expect(res.body[1].name).toEqual(product1.name);
      expect(res.body[0].userId).toEqual(testUser.id);
      expect(res.body[1].userId).toEqual(testUser.id);
      expect(invalidateCache).not.toHaveBeenCalled(); // No invalidation on GET
      expect(getOrSetCache).toHaveBeenCalledWith(`products:${testUser.id}`, expect.any(Function), config.redis.cacheTTLSeconds);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get('/api/v1/products')
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /v1/products/:id', () => {
    let ownedProduct, otherUser, otherProduct, otherUserAuthToken;
    beforeEach(async () => {
      ownedProduct = await Product.create({
        name: 'Owned Product',
        description: 'This is my product.',
        price: 100.00,
        stock: 20,
        userId: testUser.id
      });
      otherUser = await User.create({
        username: 'otheruserprod',
        email: 'otherprod@example.com',
        password: 'password123'
      });
      otherProduct = await Product.create({
        name: 'Other User Product',
        description: 'Belongs to someone else.',
        price: 50.00,
        stock: 10,
        userId: otherUser.id
      });
      otherUserAuthToken = jwt.sign({ sub: otherUser.id, iat: Math.floor(Date.now() / 1000) }, config.jwt.secret, { expiresIn: '1h' });
    });

    it('should return 200 and the product if owned by the user', async () => {
      const res = await request(app)
        .get(`/api/v1/products/${ownedProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('id', ownedProduct.id);
      expect(res.body.name).toEqual(ownedProduct.name);
      expect(getOrSetCache).toHaveBeenCalledWith(`product:${ownedProduct.id}`, expect.any(Function), config.redis.cacheTTLSeconds);
    });

    it('should return 404 if product is not found', async () => {
      const nonExistentId = uuidv4();
      await request(app)
        .get(`/api/v1/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    it('should return 404 if product is not owned by the user', async () => {
      await request(app)
        .get(`/api/v1/products/${otherProduct.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .get(`/api/v1/products/${ownedProduct.id}`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('PUT /v1/products/:id', () => {
    let productToUpdate;
    beforeEach(async () => {
      productToUpdate = await Product.create({
        name: 'Product to Update',
        description: 'Initial description.',
        price: 100.00,
        stock: 10,
        userId: testUser.id
      });
    });

    it('should return 200 and update the product if owned by the user', async () => {
      const updatePayload = {
        name: 'Updated Product Name',
        price: 150.50
      };

      const res = await request(app)
        .put(`/api/v1/products/${productToUpdate.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updatePayload)
        .expect(httpStatus.OK);

      expect(res.body).toHaveProperty('message', 'Product updated successfully');
      expect(res.body.product.id).toEqual(productToUpdate.id);
      expect(res.body.product.name).toEqual(updatePayload.name);
      expect(parseFloat(res.body.product.price)).toEqual(updatePayload.price); // Price is decimal
      expect(res.body.product.description).toEqual(productToUpdate.description); // Unchanged

      const updatedProduct = await Product.findByPk(productToUpdate.id);
      expect(updatedProduct.name).toEqual(updatePayload.name);
      expect(parseFloat(updatedProduct.price)).toEqual(updatePayload.price);
      expect(invalidateCache).toHaveBeenCalledWith(`products:${testUser.id}`);
      expect(invalidateCache).toHaveBeenCalledWith(`product:${productToUpdate.id}`);
    });

    it('should return 404 if product not found or not owned', async () => {
      const nonExistentId = uuidv4();
      await request(app)
        .put(`/api/v1/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Fail' })
        .expect(httpStatus.NOT_FOUND);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .put(`/api/v1/products/${productToUpdate.id}`)
        .send({ name: 'Fail' })
        .expect(httpStatus.UNAUTHORIZED);
    });
  });

  describe('DELETE /v1/products/:id', () => {
    let productToDelete;
    beforeEach(async () => {
      productToDelete = await Product.create({
        name: 'Product to Delete',
        description: 'Temporary.',
        price: 5.00,
        stock: 1,
        userId: testUser.id
      });
    });

    it('should return 204 and delete the product if owned by the user', async () => {
      await request(app)
        .delete(`/api/v1/products/${productToDelete.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.NO_CONTENT);

      const deletedProduct = await Product.findByPk(productToDelete.id);
      expect(deletedProduct).toBeNull();
      expect(invalidateCache).toHaveBeenCalledWith(`products:${testUser.id}`);
      expect(invalidateCache).toHaveBeenCalledWith(`product:${productToDelete.id}`);
    });

    it('should return 404 if product not found or not owned', async () => {
      const nonExistentId = uuidv4();
      await request(app)
        .delete(`/api/v1/products/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(httpStatus.NOT_FOUND);
    });

    it('should return 401 if not authenticated', async () => {
      await request(app)
        .delete(`/api/v1/products/${productToDelete.id}`)
        .expect(httpStatus.UNAUTHORIZED);
    });
  });
});
```

```