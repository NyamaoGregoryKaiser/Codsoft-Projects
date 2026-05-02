```javascript
const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/config/db');
const { User, Product } = require('../../src/models');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../../src/utils/jwt');
const { redisClient, disconnectRedis } = require('../../src/config/redis');

let adminToken;
let userToken;
let adminUser;
let testProduct;

beforeAll(async () => {
  // Ensure database is clean and migrated for integration tests
  await sequelize.sync({ force: true }); // Use force: true for integration tests to clear DB
  await sequelize.query('TRUNCATE TABLE "users", "products" RESTART IDENTITY CASCADE;');

  const hashedPassword = await bcrypt.hash('password123', 10);

  adminUser = await User.create({
    username: 'adminUser',
    email: 'admin@integration.com',
    password: hashedPassword,
    role: 'admin',
  });
  const regularUser = await User.create({
    username: 'regularUser',
    email: 'user@integration.com',
    password: hashedPassword,
    role: 'user',
  });

  adminToken = generateToken({ id: adminUser.id, role: adminUser.role });
  userToken = generateToken({ id: regularUser.id, role: regularUser.role });

  testProduct = await Product.create({
    name: 'Integration Test Product',
    description: 'A product for integration testing.',
    price: 99.99,
    stock: 10,
    userId: adminUser.id,
  });
});

afterAll(async () => {
  await sequelize.close();
  await disconnectRedis(); // Ensure Redis client is disconnected
});

describe('Auth API Endpoints', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newUser',
        email: 'newuser@integration.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('newuser@integration.com');
  });

  it('should login an existing user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@integration.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.email).toBe('admin@integration.com');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@integration.com',
        password: 'wrongpassword',
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should get authenticated user profile', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.email).toBe('admin@integration.com');
    expect(res.body.role).toBe('admin');
  });

  it('should not get profile without token', async () => {
    const res = await request(app)
      .get('/api/auth/profile');
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Not authorized, no token');
  });
});

describe('Product API Endpoints', () => {
  it('should get all products (public)', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toEqual(200);
    expect(res.body.rows).toBeInstanceOf(Array);
    expect(res.body.rows.length).toBeGreaterThan(0);
    expect(res.body.rows[0].name).toBe('Integration Test Product');
  });

  it('should get a product by ID (public)', async () => {
    const res = await request(app).get(`/api/products/${testProduct.id}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Integration Test Product');
  });

  it('should not get a non-existent product', async () => {
    const res = await request(app).get('/api/products/non-existent-id');
    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('message', 'Product not found');
  });

  it('should allow admin to create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Product by Admin',
        description: 'Description for new product',
        price: 150.00,
        stock: 20,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toBe('New Product by Admin');
    expect(res.body.userId).toBe(adminUser.id);
  });

  it('should allow user to create a product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'New Product by User',
        description: 'Description for user product',
        price: 75.00,
        stock: 30,
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.name).toBe('New Product by User');
  });

  it('should not create product without authentication', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        name: 'Unauth Product',
        price: 10,
        stock: 10
      });
    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('message', 'Not authorized, no token');
  });

  it('should allow admin to update any product', async () => {
    const res = await request(app)
      .put(`/api/products/${testProduct.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Updated Admin Product',
        price: 101.00,
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('Updated Admin Product');
    expect(res.body.price).toBe('101.00'); // Sequelize returns price as string
  });

  it('should allow user to update their own product', async () => {
    const user = await User.findOne({ where: { email: 'user@integration.com' } });
    const userProduct = await Product.create({
      name: 'User Own Product',
      description: 'User description',
      price: 10.00,
      stock: 5,
      userId: user.id,
    });

    const res = await request(app)
      .put(`/api/products/${userProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`) // Regular user trying to update
      .send({
        name: 'User Own Product Updated',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toBe('User Own Product Updated');
  });

  it('should not allow user to update another user\'s product', async () => {
    const otherUserProduct = await Product.create({
      name: 'Other User Product',
      description: 'Other User description',
      price: 10.00,
      stock: 5,
      userId: adminUser.id, // Admin owns this
    });

    const res = await request(app)
      .put(`/api/products/${otherUserProduct.id}`)
      .set('Authorization', `Bearer ${userToken}`) // Regular user trying to update
      .send({
        name: 'Attempted Update',
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Unauthorized to update this product');
  });

  it('should allow admin to delete any product', async () => {
    const user = await User.findOne({ where: { email: 'user@integration.com' } });
    const productToDelete = await Product.create({
      name: 'To be deleted by Admin',
      price: 10.00,
      stock: 1,
      userId: user.id,
    });
    const res = await request(app)
      .delete(`/api/products/${productToDelete.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Product deleted successfully');
    const checkDeleted = await request(app).get(`/api/products/${productToDelete.id}`);
    expect(checkDeleted.statusCode).toEqual(404);
  });

  it('should allow user to delete their own product', async () => {
    const user = await User.findOne({ where: { email: 'user@integration.com' } });
    const userProductToDelete = await Product.create({
      name: 'To be deleted by User',
      price: 10.00,
      stock: 1,
      userId: user.id,
    });
    const res = await request(app)
      .delete(`/api/products/${userProductToDelete.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Product deleted successfully');
  });

  it('should not allow user to delete another user\'s product', async () => {
    const otherUserProductToDelete = await Product.create({
      name: 'Other user product to delete',
      price: 10.00,
      stock: 1,
      userId: adminUser.id,
    });
    const res = await request(app)
      .delete(`/api/products/${otherUserProductToDelete.id}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toEqual(403);
    expect(res.body).toHaveProperty('message', 'Unauthorized to delete this product');
  });
});
```