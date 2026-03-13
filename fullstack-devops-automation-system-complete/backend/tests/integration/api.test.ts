```typescript
import request from 'supertest';
import { AppDataSource } from '../../src/database/data-source';
import app from '../../src/app';
import { User } from '../../src/database/entities/User';
import { Category } from '../../src/database/entities/Category';
import { Product } from '../../src/database/entities/Product';
import { UserRole } from '../../src/types/enums';
import { seed } from '../../src/database/seeds/seed';
import config from '../../src/config/config';
import cache from '../../src/utils/cache';

// Mocking cache to prevent actual caching during tests
jest.mock('../../src/utils/cache', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  keys: jest.fn(() => []),
}));

describe('API Integration Tests', () => {
  let adminToken: string;
  let userToken: string;
  let adminUser: User;
  let regularUser: User;
  let testCategory: Category;
  let testProduct: Product;

  beforeAll(async () => {
    // Initialize DB connection using a dedicated test database or in-memory
    // For simplicity, we'll re-use the main data-source and clear/seed it
    await AppDataSource.initialize();
    await AppDataSource.runMigrations(); // Ensure migrations are run

    // Seed data before tests
    await seed();

    // Log in admin and regular user to get tokens
    const adminLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'AdminPassword123!' });
    adminToken = adminLoginRes.body.token;
    adminUser = adminLoginRes.body.user;

    const userLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'UserPassword123!' });
    userToken = userLoginRes.body.token;
    regularUser = userLoginRes.body.user;

    // Fetch an existing category and product for tests
    const categories = await AppDataSource.getRepository(Category).find();
    testCategory = categories[0];

    const products = await AppDataSource.getRepository(Product).find({ relations: ['category'] });
    testProduct = products[0];
  });

  afterAll(async () => {
    await AppDataSource.destroy(); // Close DB connection
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  // --- Auth Routes ---
  describe('Auth Routes', () => {
    it('should register a new user as ADMIN by an existing ADMIN', async () => {
      const newUser = {
        username: 'newadmin',
        email: 'newadmin@example.com',
        password: 'Password123!',
        role: UserRole.ADMIN,
      };
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toEqual(newUser.email);
      expect(res.body.user.role).toEqual(UserRole.ADMIN);
    });

    it('should NOT register a new ADMIN user by a regular USER', async () => {
      const newUser = {
        username: 'user_trying_to_be_admin',
        email: 'user_to_admin@example.com',
        password: 'Password123!',
        role: UserRole.ADMIN,
      };
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newUser);

      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('Unauthorized: Only ADMIN can create ADMIN users');
    });

    it('should NOT register a new user with existing email', async () => {
      const newUser = {
        username: 'anotheruser',
        email: 'admin@example.com', // Existing email
        password: 'Password123!',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`) // Admin can register, but email already exists
        .send(newUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('email already exists');
    });

    it('should NOT register a new user with weak password', async () => {
      const newUser = {
        username: 'weakpassuser',
        email: 'weakpass@example.com',
        password: 'weak',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newUser);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Invalid password');
    });

    it('should login a user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'UserPassword123!' });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toEqual('user@example.com');
      expect(res.body.user).not.toHaveProperty('password');
    });

    it('should NOT login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(401);
      expect(res.body.message).toEqual('Invalid credentials');
    });
  });

  // --- User Routes (Admin only) ---
  describe('User Routes', () => {
    it('should get all users as ADMIN', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThanOrEqual(2); // admin, user, plus any new ones created
      expect(res.body[0]).not.toHaveProperty('password');
    });

    it('should NOT get all users as regular USER', async () => {
      const res = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toContain('Admin access required');
    });

    it('should get a user by ID as ADMIN', async () => {
      const res = await request(app).get(`/api/users/${regularUser.id}`).set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(regularUser.id);
      expect(res.body).not.toHaveProperty('password');
    });

    it('should update a user role as ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.ADMIN });

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toContain('User role updated successfully');
      expect(res.body.user.role).toEqual(UserRole.ADMIN);

      // Revert role for future tests
      await request(app)
        .patch(`/api/users/${regularUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });
    });

    it('should NOT update your own user role as ADMIN', async () => {
      const res = await request(app)
        .patch(`/api/users/${adminUser.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.USER });

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Cannot change your own role');
    });

    it('should NOT delete your own user as ADMIN', async () => {
      const res = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(400);
      expect(res.body.message).toContain('Cannot delete yourself');
    });

    it('should delete a user as ADMIN', async () => {
      // Create a temporary user to delete
      const tempUser = {
        username: 'todelete',
        email: 'todelete@example.com',
        password: 'Password123!',
        role: UserRole.USER,
      };
      const createRes = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tempUser);
      const tempUserId = createRes.body.user.id;

      const res = await request(app)
        .delete(`/api/users/${tempUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);

      // Verify deletion
      const getRes = await request(app).get(`/api/users/${tempUserId}`).set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.statusCode).toEqual(404);
    });
  });

  // --- Category Routes ---
  describe('Category Routes', () => {
    it('should get all categories (protected)', async () => {
      const res = await request(app).get('/api/categories').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.length).toBeGreaterThan(0);
      expect(cache.set).toHaveBeenCalled(); // Should cache the result
    });

    it('should get a category by ID (protected)', async () => {
      const res = await request(app)
        .get(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(testCategory.name);
    });

    it('should create a new category as ADMIN', async () => {
      const newCategory = { name: 'New Test Category' };
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newCategory);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual(newCategory.name);
      expect(cache.del).toHaveBeenCalled(); // Should invalidate cache
    });

    it('should NOT create a new category as regular USER', async () => {
      const newCategory = { name: 'User Created Category' };
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newCategory);

      expect(res.statusCode).toEqual(403);
    });

    it('should update a category as ADMIN', async () => {
      const updatedName = 'Updated Test Category';
      const res = await request(app)
        .put(`/api/categories/${testCategory.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: updatedName });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updatedName);
      expect(cache.del).toHaveBeenCalled(); // Should invalidate cache
    });

    it('should delete a category as ADMIN', async () => {
      // Create a temporary category to delete
      const tempCategory = { name: 'Temp Category for Deletion' };
      const createRes = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tempCategory);
      const tempCategoryId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/categories/${tempCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
      expect(cache.del).toHaveBeenCalled(); // Should invalidate cache

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/categories/${tempCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.statusCode).toEqual(404);
    });
  });

  // --- Product Routes ---
  describe('Product Routes', () => {
    it('should get all products with pagination (protected)', async () => {
      const res = await request(app).get('/api/products?limit=2&offset=0').set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.products.length).toBeLessThanOrEqual(2);
      expect(res.body).toHaveProperty('total');
      expect(cache.set).toHaveBeenCalled(); // Should cache the result
    });

    it('should get products filtered by category name', async () => {
        const res = await request(app)
          .get(`/api/products?category=${testCategory.name}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.products.length).toBeGreaterThan(0);
        expect(res.body.products[0].category.name).toEqual(testCategory.name);
        expect(cache.set).toHaveBeenCalled();
    });

    it('should get products searched by name or description', async () => {
        const res = await request(app)
          .get(`/api/products?search=${testProduct.name.substring(0, 5)}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.products.length).toBeGreaterThan(0);
        expect(res.body.products[0].name).toContain(testProduct.name.substring(0, 5));
        expect(cache.set).toHaveBeenCalled();
    });

    it('should get a product by ID (protected)', async () => {
      const res = await request(app)
        .get(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(testProduct.name);
      expect(res.body).toHaveProperty('category');
    });

    it('should create a new product as ADMIN', async () => {
      const newProduct = {
        name: 'New Test Product',
        description: 'Description for new test product',
        price: 99.99,
        stock: 100,
        categoryId: testCategory.id,
      };
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newProduct);

      expect(res.statusCode).toEqual(201);
      expect(res.body.name).toEqual(newProduct.name);
      expect(res.body.category.id).toEqual(testCategory.id);
      expect(cache.keys).toHaveBeenCalled(); // Should call keys to invalidate
      expect(cache.del).toHaveBeenCalled(); // Should invalidate all product caches
    });

    it('should NOT create a new product as regular USER', async () => {
      const newProduct = {
        name: 'User Product',
        description: 'Description',
        price: 10.00,
        stock: 10,
        categoryId: testCategory.id,
      };
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProduct);

      expect(res.statusCode).toEqual(403);
    });

    it('should update a product as ADMIN', async () => {
      const updatedName = 'Updated Product Name';
      const updatedPrice = 120.50;
      const res = await request(app)
        .put(`/api/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: updatedName,
          description: testProduct.description,
          price: updatedPrice,
          stock: testProduct.stock,
          categoryId: testCategory.id,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.name).toEqual(updatedName);
      expect(res.body.price).toEqual(updatedPrice.toFixed(2)); // Decimal conversion
      expect(cache.keys).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();
    });

    it('should delete a product as ADMIN', async () => {
      // Create a temporary product to delete
      const tempProduct = {
        name: 'Temp Product for Deletion',
        description: 'Temp Description',
        price: 1.00,
        stock: 1,
        categoryId: testCategory.id,
      };
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(tempProduct);
      const tempProductId = createRes.body.id;

      const res = await request(app)
        .delete(`/api/products/${tempProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toEqual(204);
      expect(cache.keys).toHaveBeenCalled();
      expect(cache.del).toHaveBeenCalled();

      // Verify deletion
      const getRes = await request(app)
        .get(`/api/products/${tempProductId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.statusCode).toEqual(404);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting to login attempts', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'user@example.com', password: 'wrongpassword' });
      }

      // The 6th attempt should be rate limited
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrongpassword' });

      expect(res.statusCode).toEqual(429);
      expect(res.body.message).toContain('Too many login attempts');
    }, 30000); // Increased timeout for rate limit tests
  });
});
```