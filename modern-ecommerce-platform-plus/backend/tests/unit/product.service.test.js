const knex = require('../../src/database/knexfile');
const productService = require('../../src/services/product.service');

// Mock knex methods
jest.mock('../../src/database/knexfile', () => {
  const mKnex = {
    insert: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn(),
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    del: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };
  mKnex.raw = jest.fn(() => Promise.resolve()); // Mock raw for server.js
  mKnex.migrate = { latest: jest.fn(() => Promise.resolve()) };
  mKnex.seed = { run: jest.fn(() => Promise.resolve()) };
  mKnex.fn = { now: jest.fn(() => 'current_timestamp') }; // Mock knex.fn.now()
  return {
    ...mKnex,
    default: mKnex, // Export the mock directly if knexfile.js exports `require('knex')(config)`
  };
});

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock chainable methods
    knex.insert.mockReturnThis();
    knex.returning.mockReturnThis();
    knex.where.mockReturnThis();
    knex.first.mockReturnThis();
    knex.select.mockReturnThis();
    knex.leftJoin.mockReturnThis();
    knex.count.mockReturnThis();
    knex.orderBy.mockReturnThis();
    knex.limit.mockReturnThis();
    knex.offset.mockReturnThis();
    knex.clone.mockReturnThis();
    knex.del.mockReturnThis();
    knex.update.mockReturnThis();
  });

  describe('createProduct', () => {
    test('should create a new product', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 10.00,
        stock: 100,
        categoryId: 1,
        imageUrl: 'http://example.com/image.jpg'
      };
      const createdProduct = { id: 1, ...productData, createdAt: '...', updatedAt: '...' };

      knex.returning.mockResolvedValueOnce([createdProduct]);

      const result = await productService.createProduct(productData);

      expect(knex.insert).toHaveBeenCalledWith(productData);
      expect(result).toEqual(createdProduct);
    });

    test('should throw error if product creation fails', async () => {
      knex.returning.mockImplementationOnce(() => {
        throw new Error('DB error');
      });

      const productData = { name: 'Fail Product', price: 1, stock: 1, categoryId: 1 };

      await expect(productService.createProduct(productData)).rejects.toThrow('Failed to create product');
    });
  });

  describe('queryProducts', () => {
    test('should return paginated products with filters', async () => {
      const mockProducts = [{ id: 1, name: 'Product 1', price: 10, category_name: 'Electronics' }];
      const mockCount = { total: '1' };

      // Mock the count query
      knex.clone.mockReturnThis(); // For both count and data queries
      knex.count.mockResolvedValueOnce(mockCount);

      // Mock the data query
      knex.orderBy.mockReturnThis();
      knex.limit.mockReturnThis();
      knex.offset.mockResolvedValueOnce(mockProducts); // The final exec of data query

      const filter = { name: 'Product', categoryId: 1, minPrice: 5, maxPrice: 15 };
      const options = { page: 1, limit: 10, sortBy: 'name', order: 'asc' };

      const result = await productService.queryProducts(filter, options);

      expect(knex.select).toHaveBeenCalledWith(
        'products.*',
        knex.raw('COALESCE(categories.name, ?) as category_name', ['Uncategorized'])
      );
      expect(knex.leftJoin).toHaveBeenCalledWith('categories', 'products.categoryId', 'categories.id');
      expect(knex.where).toHaveBeenCalledWith('products.name', 'ilike', '%Product%');
      expect(knex.where).toHaveBeenCalledWith('products.categoryId', 1);
      expect(knex.where).toHaveBeenCalledWith('products.price', '>=', 5);
      expect(knex.where).toHaveBeenCalledWith('products.price', '<=', 15);
      expect(knex.orderBy).toHaveBeenCalledWith('name', 'asc');
      expect(knex.limit).toHaveBeenCalledWith(10);
      expect(knex.offset).toHaveBeenCalledWith(0);

      expect(result).toEqual({
        products: mockProducts,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalResults: 1,
      });
    });

    test('should return empty array if no products found', async () => {
      const mockCount = { total: '0' };
      knex.clone.mockReturnThis();
      knex.count.mockResolvedValueOnce(mockCount);
      knex.orderBy.mockReturnThis();
      knex.limit.mockReturnThis();
      knex.offset.mockResolvedValueOnce([]);

      const result = await productService.queryProducts({}, {});

      expect(result.products).toEqual([]);
      expect(result.totalResults).toBe(0);
    });
  });

  describe('getProductById', () => {
    test('should return a product by its ID', async () => {
      const mockProduct = { id: 1, name: 'Product 1', category_name: 'Electronics' };
      knex.where.mockResolvedValueOnce(mockProduct);
      knex.first.mockResolvedValueOnce(mockProduct); // Ensure first is called

      const result = await productService.getProductById(1);

      expect(knex.where).toHaveBeenCalledWith('products.id', 1);
      expect(knex.first).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    test('should return null if product not found', async () => {
      knex.where.mockResolvedValueOnce(undefined);
      knex.first.mockResolvedValueOnce(undefined);

      const result = await productService.getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateProductById', () => {
    test('should update a product by its ID', async () => {
      const existingProduct = { id: 1, name: 'Old Name', description: 'Old Desc', price: 10, stock: 10 };
      const updateBody = { name: 'New Name', price: 12.50 };
      const updatedProduct = { ...existingProduct, ...updateBody, updatedAt: 'current_timestamp' };

      knex.where.mockResolvedValueOnce(existingProduct); // For first()
      knex.first.mockResolvedValueOnce(existingProduct);
      knex.returning.mockResolvedValueOnce([updatedProduct]); // For update().returning()

      const result = await productService.updateProductById(1, updateBody);

      expect(knex.where).toHaveBeenCalledWith({ id: 1 });
      expect(knex.update).toHaveBeenCalledWith(expect.objectContaining(updateBody));
      expect(result).toEqual(updatedProduct);
    });

    test('should return null if product to update is not found', async () => {
      knex.where.mockResolvedValueOnce(undefined);
      knex.first.mockResolvedValueOnce(undefined);

      const result = await productService.updateProductById(999, { name: 'Nonexistent' });

      expect(knex.update).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteProductById', () => {
    test('should delete a product by its ID', async () => {
      knex.del.mockResolvedValueOnce(1); // 1 row deleted

      const result = await productService.deleteProductById(1);

      expect(knex.where).toHaveBeenCalledWith({ id: 1 });
      expect(knex.del).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should return false if product to delete is not found', async () => {
      knex.del.mockResolvedValueOnce(0); // 0 rows deleted

      const result = await productService.deleteProductById(999);

      expect(result).toBe(false);
    });
  });
});