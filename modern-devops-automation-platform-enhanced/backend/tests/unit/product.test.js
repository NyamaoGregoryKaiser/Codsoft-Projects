```javascript
const productService = require('../../src/services/productService');
const { Product, User } = require('../../src/models');
const { sequelize } = require('../../src/config/db');

// Mock models and their methods
jest.mock('../../src/models', () => ({
  Product: {
    findAndCountAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    destroy: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  sequelize: { // Mock sequelize
    define: jest.fn(),
    sync: jest.fn(),
  }
}));

// Mock clearCache for product updates
jest.mock('../../src/middleware/cacheMiddleware', () => ({
  clearCache: jest.fn(),
}));

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear mocks before each test
  });

  const mockUser = {
    id: 'user123',
    username: 'testuser',
    role: 'user',
  };

  const mockAdmin = {
    id: 'admin123',
    username: 'adminuser',
    role: 'admin',
  };

  const mockProduct = {
    id: 'product1',
    name: 'Test Product',
    description: 'A description',
    price: 10.00,
    stock: 100,
    userId: mockUser.id,
    update: jest.fn(function(data) {
      Object.assign(this, data);
      return this;
    }),
    destroy: jest.fn(),
  };

  describe('getProducts', () => {
    it('should return a list of products with pagination and search', async () => {
      Product.findAndCountAll.mockResolvedValue({
        count: 1,
        rows: [mockProduct],
      });

      const result = await productService.getProducts({}, { page: 1, limit: 10, search: 'Test' });

      expect(Product.findAndCountAll).toHaveBeenCalled();
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].name).toBe('Test Product');
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);

      const result = await productService.getProductById('product1');

      expect(Product.findByPk).toHaveBeenCalledWith('product1', expect.any(Object));
      expect(result.name).toBe('Test Product');
    });

    it('should throw an error if product not found', async () => {
      Product.findByPk.mockResolvedValue(null);

      await expect(productService.getProductById('nonexistent')).rejects.toThrow('Product not found');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      Product.create.mockResolvedValue(mockProduct);

      const result = await productService.createProduct({
        name: 'New Product',
        description: 'New Description',
        price: 20.00,
        stock: 50
      }, mockUser.id);

      expect(Product.create).toHaveBeenCalledWith({
        name: 'New Product',
        description: 'New Description',
        price: 20.00,
        stock: 50,
        userId: mockUser.id
      });
      expect(result.name).toBe('Test Product');
    });
  });

  describe('updateProduct', () => {
    it('should update a product if user is the owner', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockUser); // The user making the request is the owner

      const updatedData = { name: 'Updated Product Name' };
      const result = await productService.updateProduct('product1', updatedData, mockUser.id);

      expect(Product.findByPk).toHaveBeenCalledWith('product1');
      expect(mockProduct.update).toHaveBeenCalledWith(updatedData);
      expect(result.name).toBe('Updated Product Name');
    });

    it('should update a product if user is an admin', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockAdmin); // The user making the request is an admin

      const updatedData = { name: 'Updated Product Name by Admin' };
      const result = await productService.updateProduct('product1', updatedData, mockAdmin.id);

      expect(Product.findByPk).toHaveBeenCalledWith('product1');
      expect(mockProduct.update).toHaveBeenCalledWith(updatedData);
      expect(result.name).toBe('Updated Product Name by Admin');
    });

    it('should throw an error if product not found', async () => {
      Product.findByPk.mockResolvedValue(null);

      await expect(productService.updateProduct('nonexistent', {}, mockUser.id)).rejects.toThrow('Product not found');
    });

    it('should throw an error if user is not the owner or admin', async () => {
      const otherUser = { id: 'otherUser123', role: 'user' };
      Product.findByPk.mockResolvedValue(mockProduct); // Product belongs to mockUser
      User.findByPk.mockResolvedValue(otherUser); // Request from otherUser

      await expect(productService.updateProduct('product1', {}, otherUser.id)).rejects.toThrow('Unauthorized to update this product');
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product if user is the owner', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockUser);

      const result = await productService.deleteProduct('product1', mockUser.id);

      expect(Product.findByPk).toHaveBeenCalledWith('product1');
      expect(mockProduct.destroy).toHaveBeenCalled();
      expect(result.message).toBe('Product deleted successfully');
    });

    it('should delete a product if user is an admin', async () => {
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(mockAdmin);

      const result = await productService.deleteProduct('product1', mockAdmin.id);

      expect(Product.findByPk).toHaveBeenCalledWith('product1');
      expect(mockProduct.destroy).toHaveBeenCalled();
      expect(result.message).toBe('Product deleted successfully');
    });

    it('should throw an error if product not found', async () => {
      Product.findByPk.mockResolvedValue(null);

      await expect(productService.deleteProduct('nonexistent', mockUser.id)).rejects.toThrow('Product not found');
    });

    it('should throw an error if user is not the owner or admin', async () => {
      const otherUser = { id: 'otherUser123', role: 'user' };
      Product.findByPk.mockResolvedValue(mockProduct);
      User.findByPk.mockResolvedValue(otherUser);

      await expect(productService.deleteProduct('product1', otherUser.id)).rejects.toThrow('Unauthorized to delete this product');
    });
  });
});
```