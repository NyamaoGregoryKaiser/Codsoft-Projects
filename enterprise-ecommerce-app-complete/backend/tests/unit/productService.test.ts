```typescript
import { productService } from '../../src/services/productService';
import prisma from '../../src/utils/prisma'; // Mock prisma client
import { AppError } from '../../src/utils/errorHandler';
import { clearCacheByPattern, deleteCache, getCache, setCache } from '../../src/utils/cache';
import { ProductStatus } from '@prisma/client';

// Mock Prisma Client methods
jest.mock('../../src/utils/prisma', () => ({
  product: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $on: jest.fn(),
  $disconnect: jest.fn(),
}));

// Mock cache functions
jest.mock('../../src/utils/cache', () => ({
  getCache: jest.fn(),
  setCache: jest.fn(),
  deleteCache: jest.fn(),
  clearCacheByPattern: jest.fn(),
  redisClient: {
    ping: jest.fn(() => Promise.resolve('PONG')),
    on: jest.fn(),
    del: jest.fn(),
    keys: jest.fn(() => Promise.resolve([])),
    setex: jest.fn(),
    get: jest.fn(),
  },
  connectRedis: jest.fn(),
}));

const mockProduct = {
  id: 'some-uuid-1',
  name: 'Test Product',
  description: 'A description of the test product.',
  price: 100.00,
  stock: 10,
  categoryId: 'category-uuid-1',
  imageUrl: 'http://example.com/image.jpg',
  status: ProductStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockCategory = {
  id: 'category-uuid-1',
  name: 'Electronics',
  description: 'Electronic devices',
  imageUrl: 'http://example.com/cat-image.jpg',
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    it('should create a new product and clear cache', async () => {
      (prisma.product.create as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.createProduct({
        name: 'New Product',
        description: 'New Description',
        price: 50.00,
        stock: 5,
        categoryId: 'category-uuid-1',
      });

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Product',
          description: 'New Description',
          price: 50.00,
          stock: 5,
          categoryId: 'category-uuid-1',
        },
      });
      expect(clearCacheByPattern).toHaveBeenCalledWith('products:*');
      expect(result).toEqual(mockProduct);
    });
  });

  describe('getProductById', () => {
    it('should return a product from cache if available', async () => {
      (getCache as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById(mockProduct.id);

      expect(getCache).toHaveBeenCalledWith(`product:${mockProduct.id}`);
      expect(prisma.product.findUnique).not.toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should fetch from DB, cache, and return product if not in cache', async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue({ ...mockProduct, category: mockCategory });

      const result = await productService.getProductById(mockProduct.id);

      expect(getCache).toHaveBeenCalledWith(`product:${mockProduct.id}`);
      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        include: { category: true, reviews: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
      });
      expect(setCache).toHaveBeenCalledWith(`product:${mockProduct.id}`, { ...mockProduct, category: mockCategory }, 3600);
      expect(result).toEqual({ ...mockProduct, category: mockCategory });
    });

    it('should return null if product not found', async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await productService.getProductById('non-existent-id');

      expect(result).toBeNull();
      expect(setCache).not.toHaveBeenCalled();
    });
  });

  describe('listProducts', () => {
    const mockProductsList = [mockProduct, { ...mockProduct, id: 'some-uuid-2', name: 'Another Product' }];

    it('should return products from cache if available', async () => {
      (getCache as jest.Mock).mockResolvedValue({ products: mockProductsList, total: 2 });

      const result = await productService.listProducts({});

      expect(getCache).toHaveBeenCalled(); // Specific key depends on filters
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(result.products).toEqual(mockProductsList);
      expect(result.total).toBe(2);
    });

    it('should fetch from DB, cache, and return products if not in cache', async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProductsList);
      (prisma.product.count as jest.Mock).mockResolvedValue(2);

      const result = await productService.listProducts({ page: 1, limit: 10 });

      expect(getCache).toHaveBeenCalled();
      expect(prisma.product.findMany).toHaveBeenCalledWith({
        where: {},
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { category: true },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({ where: {} });
      expect(setCache).toHaveBeenCalled();
      expect(result.products).toEqual(mockProductsList);
      expect(result.total).toBe(2);
    });

    it('should apply filters correctly', async () => {
      (getCache as jest.Mock).mockResolvedValue(null);
      (prisma.product.findMany as jest.Mock).mockResolvedValue([mockProductsList[0]]);
      (prisma.product.count as jest.Mock).mockResolvedValue(1);

      const filters = { search: 'Test', minPrice: 50, category: 'category-uuid-1' };
      await productService.listProducts(filters);

      expect(prisma.product.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          categoryId: filters.category,
          OR: [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ],
          price: { gte: filters.minPrice },
        },
      }));
    });
  });

  describe('updateProduct', () => {
    it('should update a product and invalidate caches', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.update as jest.Mock).mockResolvedValue({ ...mockProduct, name: 'Updated Name' });

      const result = await productService.updateProduct(mockProduct.id, { name: 'Updated Name' });

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: mockProduct.id },
        data: { name: 'Updated Name' },
      });
      expect(deleteCache).toHaveBeenCalledWith(`product:${mockProduct.id}`);
      expect(clearCacheByPattern).toHaveBeenCalledWith('products:*');
      expect(result.name).toBe('Updated Name');
    });

    it('should throw AppError if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.updateProduct('non-existent-id', { name: 'Update' }))
        .rejects.toThrow(AppError);
      expect(prisma.product.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product and invalidate caches', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);
      (prisma.product.delete as jest.Mock).mockResolvedValue(mockProduct);

      await productService.deleteProduct(mockProduct.id);

      expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: mockProduct.id } });
      expect(deleteCache).toHaveBeenCalledWith(`product:${mockProduct.id}`);
      expect(clearCacheByPattern).toHaveBeenCalledWith('products:*');
    });

    it('should throw AppError if product not found', async () => {
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.deleteProduct('non-existent-id'))
        .rejects.toThrow(AppError);
      expect(prisma.product.delete).not.toHaveBeenCalled();
    });
  });
});
```