```typescript
import request from 'supertest';
import { app } from '../../src/app';
import prisma from '../../src/utils/prisma';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config';
import { UserRole, ProductStatus } from '@prisma/client';

// Mock Prisma client to isolate tests from actual DB
jest.mock('../../src/utils/prisma', () => ({
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  $on: jest.fn(),
  $disconnect: jest.fn(),
}));

// Mock cache functions as they are external dependencies
jest.mock('../../src/utils/cache', () => ({
  getCache: jest.fn(() => Promise.resolve(null)),
  setCache: jest.fn(() => Promise.resolve()),
  deleteCache: jest.fn(() => Promise.resolve()),
  clearCacheByPattern: jest.fn(() => Promise.resolve()),
  redisClient: {
    ping: jest.fn(() => Promise.resolve('PONG')),
    on: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
    setex: jest.fn(),
    get: jest.fn(),
  },
  connectRedis: jest.fn(() => Promise.resolve()),
}));

const adminUserId = 'admin-user-id-123';
const regularUserId = 'regular-user-id-456';
const adminToken = jwt.sign({ id: adminUserId, email: 'admin@test.com', role: UserRole.ADMIN }, config.JWT_SECRET, { expiresIn: '1h' });
const userToken = jwt.sign({ id: regularUserId, email: 'user@test.com', role: UserRole.USER }, config.JWT_SECRET, { expiresIn: '1h' });

const mockAdminUser = { id: adminUserId, email: 'admin@test.com', role: UserRole.ADMIN, passwordChangedAt: null };
const mockRegularUser = { id: regularUserId, email: 'user@test.com', role: UserRole.USER, passwordChangedAt: null };

const mockProduct = {
  id: 'product-id-123',
  name: 'Integration Test Product',
  description: 'This is a product for integration testing.',
  price: 25.99,
  stock: 10,
  categoryId: 'category-id-abc',
  imageUrl: 'http://test.com/image.jpg',
  status: ProductStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Product Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock user lookup for auth middleware
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where: { id } }) => {
      if (id === adminUserId) return mockAdminUser;
      if (id === regularUserId) return mockRegularUser;
      return null;
    });
    // Ensure cache is mocked to always miss for consistent test results
    require('../../src/utils/cache').getCache.mockResolvedValue(null);
  });

  describe('GET /api/v1/products', () => {
    it('should return a list of products', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProduct]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const res = await request(app).get('/api/v1/products');

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.products).toEqual(expect.arrayContaining([expect.objectContaining({ id: mockProduct.id })]));
      expect(prisma.product.findMany).toHaveBeenCalled();
    });

    it('should apply query filters', async () => {
      (prisma.product.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.product.count as jest.Mock).mockResolvedValue(0);

      await request(app).get('/api/v1/products?search=test&minPrice=10&page=2');

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.any(Array),
          price: expect.objectContaining({ gte: 10 }),
        }),
        skip: 10, // (page-1)*limit where default limit is 10
        take: 10,
      }));
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return a single product by ID', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const res = await request(app).get(`/api/v1/products/${mockProduct.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.id).toBe(mockProduct.id);
      expect(prisma.product.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: mockProduct.id } }));
    });

    it('should return 404 if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app).get('/api/v1/products/non-existent-id');

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found.');
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = await request(app).get('/api/v1/products/invalid-uuid-format');

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('POST /api/v1/products', () => {
    const newProductData = {
      name: 'New Test Product',
      description: 'A brand new product.',
      price: 50.00,
      stock: 20,
      categoryId: 'category-id-xyz',
    };

    it('should create a new product for admin user', async () => {
      (prisma.product.create as jest.Mock).mockResolvedValue({ ...mockProduct, id: 'new-product-id', ...newProductData });

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProductData);

      expect(res.statusCode).toEqual(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.name).toBe(newProductData.name);
      expect(prisma.product.create).toHaveBeenCalledWith(expect.objectContaining({ data: newProductData }));
    });

    it('should return 401 if no token provided', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send(newProductData);

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProductData);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe('You do not have permission to perform this action.');
    });

    it('should return 400 for invalid input data', async () => {
      const invalidData = { ...newProductData, name: 'ab', price: -10 }; // Invalid name length, negative price

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Validation failed');
    });
  });

  describe('PATCH /api/v1/products/:id', () => {
    const updateData = { price: 30.50, stock: 8 };

    it('should update a product for admin user', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct); // For existence check
      (prisma.product.update as jest.Mock).mockResolvedValue({ ...mockProduct, ...updateData });

      const res = await request(app)
        .patch(`/api/v1/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.price).toBe(updateData.price);
      expect(prisma.product.update).toHaveBeenCalledWith(expect.objectContaining({
        where: { id: mockProduct.id },
        data: updateData,
      }));
    });

    it('should return 404 if product to update not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .patch('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found.');
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData);

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    it('should delete a product for admin user', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct); // For existence check
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      const res = await request(app)
        .delete(`/api/v1/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
    });

    it('should return 404 if product to delete not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/products/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe('Product not found.');
    });

    it('should return 403 if user is not admin', async () => {
      const res = await request(app)
        .delete(`/api/v1/products/${mockProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toEqual(403);
    });
  });
});
```