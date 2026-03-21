const supertest = require('supertest');
const app = require('../../src/app');
const knex = require('../../src/database/knexfile');
const { generateAuthTokens } = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

const request = supertest(app);

describe('Product Integration Tests', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let categoryId;

  beforeAll(async () => {
    // Clear and re-run migrations for a clean test database
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run(); // Run seeds to populate initial data

    // Fetch admin and regular user from seeds
    adminUser = await knex('users').where({ email: 'admin@example.com' }).first();
    const regularUser = await knex('users').where({ email: 'john.doe@example.com' }).first();
    const electronicsCategory = await knex('categories').where({ name: 'Electronics' }).first();
    categoryId = electronicsCategory.id;

    // Generate tokens
    const adminAuth = await generateAuthTokens(adminUser.id, adminUser.role);
    adminToken = adminAuth.access.token;

    const userAuth = await generateAuthTokens(regularUser.id, regularUser.role);
    userToken = userAuth.access.token;
  });

  afterAll(async () => {
    await knex.migrate.rollback(); // Rollback migrations after all tests
    await knex.destroy(); // Close DB connection
  });

  // Test Product Creation
  describe('POST /api/v1/products', () => {
    test('should create a new product for admin user', async () => {
      const newProductData = {
        name: 'Integration Test Product',
        description: 'Product for integration testing.',
        price: 99.99,
        stock: 50,
        categoryId: categoryId,
        imageUrl: 'https://example.com/test_product.jpg',
      };

      const res = await request
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProductData)
        .expect(201);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toMatchObject({
        name: newProductData.name,
        price: newProductData.price.toFixed(2), // Price might be returned as string
        stock: newProductData.stock,
      });

      // Verify in DB
      const productInDb = await knex('products').where({ id: res.body.data.id }).first();
      expect(productInDb).toBeDefined();
      expect(productInDb.name).toBe(newProductData.name);
    });

    test('should return 403 for non-admin user trying to create a product', async () => {
      const newProductData = {
        name: 'Unauthorized Product',
        price: 10.00,
        stock: 10,
        categoryId: categoryId,
      };

      await request
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProductData)
        .expect(403);
    });

    test('should return 401 if no token is provided', async () => {
      const newProductData = {
        name: 'No Auth Product',
        price: 10.00,
        stock: 10,
        categoryId: categoryId,
      };

      await request
        .post('/api/v1/products')
        .send(newProductData)
        .expect(401);
    });

    test('should return 400 for invalid product data', async () => {
      const invalidProductData = {
        name: 'Invalid Product',
        price: -10.00, // Invalid price
        stock: 5,
        categoryId: categoryId,
      };

      await request
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidProductData)
        .expect(400);
    });
  });

  // Test Product Listing
  describe('GET /api/v1/products', () => {
    test('should retrieve a list of products', async () => {
      const res = await request
        .get('/api/v1/products')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data.products)).toBe(true);
      expect(res.body.data.products.length).toBeGreaterThan(0);
      expect(res.body.data.products[0]).toHaveProperty('name');
      expect(res.body.data.products[0]).toHaveProperty('category_name');
    });

    test('should retrieve products filtered by name', async () => {
      const res = await request
        .get('/api/v1/products?name=Test')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.products.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.products[0].name).toContain('Test');
    });

    test('should retrieve products with pagination', async () => {
      const res = await request
        .get('/api/v1/products?limit=2&page=1')
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.products.length).toBe(2);
      expect(res.body.data.page).toBe(1);
      expect(res.body.data.limit).toBe(2);
      expect(res.body.data.totalResults).toBeGreaterThanOrEqual(2);
    });
  });

  // Test Product Detail
  describe('GET /api/v1/products/:productId', () => {
    let testProductId;

    beforeAll(async () => {
      const product = await knex('products').first();
      testProductId = product.id;
    });

    test('should retrieve a single product by ID', async () => {
      const res = await request
        .get(`/api/v1/products/${testProductId}`)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data).toHaveProperty('id', testProductId);
      expect(res.body.data).toHaveProperty('name');
    });

    test('should return 404 for a non-existent product ID', async () => {
      await request
        .get('/api/v1/products/99999')
        .expect(404);
    });
  });

  // Test Product Update
  describe('PUT /api/v1/products/:productId', () => {
    let productToUpdateId;

    beforeAll(async () => {
      const [product] = await knex('products').insert({
        name: 'Product to Update',
        price: 20.00,
        stock: 50,
        categoryId: categoryId,
      }).returning('id');
      productToUpdateId = product.id;
    });

    test('should update an existing product for admin user', async () => {
      const updateData = {
        name: 'Updated Product Name',
        price: 25.50,
      };

      const res = await request
        .put(`/api/v1/products/${productToUpdateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.status).toBe('success');
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.price).toBe(updateData.price.toFixed(2));

      const productInDb = await knex('products').where({ id: productToUpdateId }).first();
      expect(productInDb.name).toBe(updateData.name);
    });

    test('should return 403 for non-admin user trying to update a product', async () => {
      await request
        .put(`/api/v1/products/${productToUpdateId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Attempted Update' })
        .expect(403);
    });

    test('should return 404 for updating a non-existent product', async () => {
      await request
        .put('/api/v1/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nonexistent Update' })
        .expect(404);
    });
  });

  // Test Product Deletion
  describe('DELETE /api/v1/products/:productId', () => {
    let productToDeleteId;

    beforeEach(async () => {
      const [product] = await knex('products').insert({
        name: 'Product to Delete',
        price: 30.00,
        stock: 10,
        categoryId: categoryId,
      }).returning('id');
      productToDeleteId = product.id;
    });

    test('should delete an existing product for admin user', async () => {
      await request
        .delete(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const productInDb = await knex('products').where({ id: productToDeleteId }).first();
      expect(productInDb).toBeUndefined();
    });

    test('should return 403 for non-admin user trying to delete a product', async () => {
      await request
        .delete(`/api/v1/products/${productToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });

    test('should return 404 for deleting a non-existent product', async () => {
      await request
        .delete('/api/v1/products/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });
});