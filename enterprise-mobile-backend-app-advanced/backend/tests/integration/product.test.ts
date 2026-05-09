import request from 'supertest';
import app from '../../src/app';
import prisma from '../../src/config/database';
import { UserRole } from '@prisma/client';
import { redisClient } from '../../src/middleware/cache.middleware';

describe('Product API Endpoints', () => {
  let adminAccessToken: string;
  let userAccessToken: string;
  let productId: string;

  const adminCredentials = {
    email: 'admin_prod_test@example.com',
    password: 'adminpassword',
    name: 'Admin Prod',
  };

  const userCredentials = {
    email: 'user_prod_test@example.com',
    password: 'userpassword',
    name: 'User Prod',
  };

  beforeAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.token.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await redisClient.flushdb();

    // Register and login admin
    await request(app).post('/api/v1/auth/register').send({ ...adminCredentials, role: UserRole.ADMIN });
    const adminLoginRes = await request(app).post('/api/v1/auth/login').send(adminCredentials);
    adminAccessToken = adminLoginRes.body.data.accessToken;

    // Register and login regular user
    await request(app).post('/api/v1/auth/register').send(userCredentials);
    const userLoginRes = await request(app).post('/api/v1/auth/login').send(userCredentials);
    userAccessToken = userLoginRes.body.data.accessToken;
  });

  afterAll(async () => {
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.token.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();
    await redisClient.flushdb();
    await prisma.$disconnect();
  });

  // Test for cache clearing in setup.ts already takes care of this
  // beforeEach(async () => {
  //   await redisClient.flushdb(); // Clear cache before each test to ensure fresh data
  // });

  describe('POST /api/v1/products', () => {
    const productData = {
      name: 'Test Product',
      description: 'A product for testing',
      price: 99.99,
      stock: 10,
    };

    it('should allow an admin to create a new product', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(productData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe(productData.name);
      expect(parseFloat(res.body.data.price)).toBe(productData.price);
      expect(res.body.data.stock).toBe(productData.stock);
      productId = res.body.data.id;
    });

    it('should return 403 if a regular user tries to create a product', async () => {
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(productData)
        .expect(403);
    });

    it('should return 401 if unauthenticated user tries to create a product', async () => {
      await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(401);
    });

    it('should return 400 for invalid product data', async () => {
      await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ ...productData, price: -10 }) // Invalid price
        .expect(400);
    });
  });

  describe('GET /api/v1/products', () => {
    it('should allow any user (even unauthenticated) to get all products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBeGreaterThan(0);
      expect(res.body.data.meta).toBeDefined();
    });

    it('should correctly apply pagination', async () => {
      // Create more products
      await request(app).post('/api/v1/products').set('Authorization', `Bearer ${adminAccessToken}`).send({ name: 'Prod 2', price: 10, stock: 10 });
      await request(app).post('/api/v1/products').set('Authorization', `Bearer ${adminAccessToken}`).send({ name: 'Prod 3', price: 20, stock: 20 });

      const res = await request(app)
        .get('/api/v1/products?limit=1&offset=0')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.data.length).toBe(1);
      expect(res.body.data.meta.limit).toBe(1);
      expect(res.body.data.meta.total).toBe(3); // 3 products in total now
    });
  });

  describe('GET /api/v1/products/:productId', () => {
    it('should allow any user to get a product by ID', async () => {
      expect(productId).toBeDefined();
      const res = await request(app)
        .get(`/api/v1/products/${productId}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(productId);
      expect(res.body.data.name).toBe('Test Product');
    });

    it('should return 404 for a non-existent product ID', async () => {
      await request(app)
        .get('/api/v1/products/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .expect(404);
    });

    it('should return 400 for an invalid UUID format', async () => {
      await request(app)
        .get('/api/v1/products/invalid-uuid')
        .expect(400);
    });
  });

  describe('PATCH /api/v1/products/:productId', () => {
    const updateData = {
      name: 'Updated Product Name',
      price: 109.99,
    };

    it('should allow an admin to update a product by ID', async () => {
      expect(productId).toBeDefined();
      const res = await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(productId);
      expect(res.body.data.name).toBe(updateData.name);
      expect(parseFloat(res.body.data.price)).toBe(updateData.price);
    });

    it('should return 403 if a regular user tries to update a product', async () => {
      await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should return 401 if unauthenticated user tries to update a product', async () => {
      await request(app)
        .patch(`/api/v1/products/${productId}`)
        .send(updateData)
        .expect(401);
    });

    it('should return 404 for updating a non-existent product', async () => {
      await request(app)
        .patch('/api/v1/products/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send(updateData)
        .expect(404);
    });

    it('should return 400 for invalid update data', async () => {
      await request(app)
        .patch(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .send({ price: 'invalid' }) // Invalid price type
        .expect(400);
    });
  });

  describe('DELETE /api/v1/products/:productId', () => {
    it('should allow an admin to delete a product by ID', async () => {
      expect(productId).toBeDefined();
      await request(app)
        .delete(`/api/v1/products/${productId}`)
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(204);

      // Verify product is actually deleted
      await request(app)
        .get(`/api/v1/products/${productId}`)
        .expect(404);
    });

    it('should return 403 if a regular user tries to delete a product', async () => {
      const newProduct = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${adminAccessToken}`).send({ name: 'Temp Prod', price: 1, stock: 1 });
      const tempProductId = newProduct.body.data.id;

      await request(app)
        .delete(`/api/v1/products/${tempProductId}`)
        .set('Authorization', `Bearer ${userAccessToken}`)
        .expect(403);
    });

    it('should return 401 if unauthenticated user tries to delete a product', async () => {
      const newProduct = await request(app).post('/api/v1/products').set('Authorization', `Bearer ${adminAccessToken}`).send({ name: 'Temp Prod2', price: 1, stock: 1 });
      const tempProductId = newProduct.body.data.id;

      await request(app)
        .delete(`/api/v1/products/${tempProductId}`)
        .expect(401);
    });

    it('should return 404 for deleting a non-existent product', async () => {
      await request(app)
        .delete('/api/v1/products/c9d0f1a2-b3c4-d5e6-f7a8-b9c0d1e2f3a4')
        .set('Authorization', `Bearer ${adminAccessToken}`)
        .expect(404);
    });
  });
});