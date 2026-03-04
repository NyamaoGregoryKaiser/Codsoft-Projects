const request = require('supertest');
const app = require('../../app');
const { Product, User } = require('../../models');
const { signToken } = require('../../utils/jwt');
const redisClient = require('../../utils/redisClient'); // Mocked

// Mocking models and redis client
jest.mock('../../models', () => ({
  Product: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    destroy: jest.fn(),
  },
  User: { // Ensure User is also mocked if used in product relations
    findByPk: jest.fn(),
  },
}));

describe('Product Controller', () => {
  let adminToken;
  let userToken;
  let adminUser;
  let regularUser;

  beforeEach(async () => {
    jest.clearAllMocks();
    redisClient.get.mockResolvedValue(null);
    redisClient.set.mockResolvedValue('OK');
    redisClient.del.mockResolvedValue(1);

    adminUser = { id: 'adminId1', username: 'admin', email: 'admin@test.com', role: 'admin' };
    regularUser = { id: 'userId1', username: 'user', email: 'user@test.com', role: 'user' };
    adminToken = signToken(adminUser.id);
    userToken = signToken(regularUser.id);

    // Mock findByPk for authMiddleware's protect function
    User.findByPk.mockImplementation(async (id) => {
      if (id === adminUser.id) return adminUser;
      if (id === regularUser.id) return regularUser;
      return null;
    });

    // Mock product instance methods if needed
    Product.findByPk.mockImplementation(async (id) => {
      if (id === 'product1') {
        return {
          id: 'product1',
          name: 'Test Product',
          description: 'A test product',
          price: 10.99,
          stock: 100,
          imageUrl: 'http://test.com/img.jpg',
          userId: adminUser.id,
          owner: adminUser, // for eager loaded relations
          save: jest.fn().mockResolvedValue(true),
          destroy: jest.fn().mockResolvedValue(true),
        };
      }
      return null;
    });
  });

  describe('GET /api/products', () => {
    it('should get all products and return 200', async () => {
      const products = [{ id: 'product1', name: 'Product 1' }, { id: 'product2', name: 'Product 2' }];
      Product.findAll.mockResolvedValue(products);
      
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.products).toEqual(products);
      expect(Product.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return cached products if available', async () => {
      const cachedProducts = [{ id: 'cached1', name: 'Cached Product' }];
      redisClient.get.mockResolvedValue(JSON.stringify(cachedProducts));
      
      const res = await request(app).get('/api/products');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.products).toEqual(cachedProducts);
      expect(redisClient.get).toHaveBeenCalledWith('all_products');
      expect(Product.findAll).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get a product by ID and return 200', async () => {
      const product = { id: 'product1', name: 'Test Product', owner: adminUser };
      Product.findByPk.mockResolvedValue(product);
      
      const res = await request(app).get('/api/products/product1');
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.name).toBe('Test Product');
      expect(Product.findByPk).toHaveBeenCalledWith('product1', expect.any(Object));
    });

    it('should return 404 if product not found', async () => {
      Product.findByPk.mockResolvedValue(null);
      
      const res = await request(app).get('/api/products/nonexistent');
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found with that ID.');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product for an authenticated user', async () => {
      const newProductData = { name: 'New Gadget', description: 'Cool gadget', price: 99.99, stock: 50, imageUrl: 'http://example.com/gadget.jpg' };
      const createdProduct = { id: 'newProductId', ...newProductData, userId: userToken };
      Product.create.mockResolvedValue(createdProduct);
      
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(newProductData);
      
      expect(res.statusCode).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.product.name).toBe('New Gadget');
      expect(Product.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'New Gadget', userId: regularUser.id }));
      expect(redisClient.del).toHaveBeenCalledWith('all_products');
    });

    it('should return 401 if not authenticated', async () => {
      const newProductData = { name: 'New Gadget', price: 99.99, stock: 50 };
      const res = await request(app)
        .post('/api/products')
        .send(newProductData);
      
      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('You are not logged in! Please log in to get access.');
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Partial Product' }); // Missing price, stock
      
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Product name, price, and stock are required.');
    });
  });

  describe('PATCH /api/products/:id', () => {
    it('should update a product for its owner', async () => {
      const productToUpdate = { id: 'product1', name: 'Old Name', userId: regularUser.id, owner: regularUser, save: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToUpdate); // Mock the initial find
      
      const res = await request(app)
        .patch('/api/products/product1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ name: 'Updated Product Name' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(productToUpdate.name).toBe('Updated Product Name');
      expect(productToUpdate.save).toHaveBeenCalledTimes(1);
      expect(redisClient.del).toHaveBeenCalledWith('all_products');
      expect(redisClient.del).toHaveBeenCalledWith('product:product1');
    });

    it('should update a product for an admin', async () => {
      const productToUpdate = { id: 'product1', name: 'Old Name', userId: 'anotherUserId', owner: {id: 'anotherUserId', role: 'user'}, save: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToUpdate);
      
      const res = await request(app)
        .patch('/api/products/product1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Admin Updated Product' });
      
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(productToUpdate.name).toBe('Admin Updated Product');
    });

    it('should return 403 if user is not owner or admin', async () => {
      const anotherUser = { id: 'anotherUserId', username: 'another', email: 'another@test.com', role: 'user' };
      User.findByPk.mockImplementation(async (id) => {
        if (id === anotherUser.id) return anotherUser;
        if (id === regularUser.id) return regularUser;
        return null;
      });
      const tokenAnotherUser = signToken(anotherUser.id);
      
      const productToUpdate = { id: 'product1', name: 'Old Name', userId: regularUser.id, owner: regularUser, save: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToUpdate);
      
      const res = await request(app)
        .patch('/api/products/product1')
        .set('Authorization', `Bearer ${tokenAnotherUser}`)
        .send({ name: 'Attempted Update' });
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You do not have permission to update this product.');
    });

    it('should return 404 if product not found', async () => {
      Product.findByPk.mockResolvedValue(null);
      const res = await request(app)
        .patch('/api/products/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Nonexistent Product Update' });
      
      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product not found with that ID.');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete a product for its owner', async () => {
      const productToDelete = { id: 'product1', name: 'Old Name', userId: regularUser.id, owner: regularUser, destroy: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToDelete);
      
      const res = await request(app)
        .delete('/api/products/product1')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(res.statusCode).toBe(204);
      expect(productToDelete.destroy).toHaveBeenCalledTimes(1);
      expect(redisClient.del).toHaveBeenCalledWith('all_products');
      expect(redisClient.del).toHaveBeenCalledWith('product:product1');
    });

    it('should delete a product for an admin', async () => {
      const productToDelete = { id: 'product1', name: 'Old Name', userId: 'anotherUserId', owner: {id: 'anotherUserId', role: 'user'}, destroy: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToDelete);
      
      const res = await request(app)
        .delete('/api/products/product1')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(res.statusCode).toBe(204);
      expect(productToDelete.destroy).toHaveBeenCalledTimes(1);
    });

    it('should return 403 if user is not owner or admin', async () => {
      const anotherUser = { id: 'anotherUserId', username: 'another', email: 'another@test.com', role: 'user' };
      User.findByPk.mockImplementation(async (id) => {
        if (id === anotherUser.id) return anotherUser;
        if (id === regularUser.id) return regularUser;
        return null;
      });
      const tokenAnotherUser = signToken(anotherUser.id);

      const productToDelete = { id: 'product1', name: 'Old Name', userId: regularUser.id, owner: regularUser, destroy: jest.fn().mockResolvedValue(true) };
      Product.findByPk.mockResolvedValue(productToDelete);
      
      const res = await request(app)
        .delete('/api/products/product1')
        .set('Authorization', `Bearer ${tokenAnotherUser}`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body.message).toBe('You do not have permission to delete this product.');
    });
  });
});