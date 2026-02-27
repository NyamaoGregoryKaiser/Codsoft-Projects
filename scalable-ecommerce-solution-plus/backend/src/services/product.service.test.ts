import productService from './product.service';
import productRepository from '../repositories/product.repository';
import cache from '../utils/cache';
import { ApiError } from '../middlewares/errorHandler';
import { Product, CreateProductDTO, UpdateProductDTO } from '../types';

// Mock dependencies
jest.mock('../repositories/product.repository');
jest.mock('../utils/cache');
jest.mock('../config/logger'); // Mock logger to prevent console spam during tests

const mockProductRepository = productRepository as jest.Mocked<typeof productRepository>;
const mockCache = cache as jest.Mocked<typeof cache>;

describe('ProductService', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mocks before each test
    });

    const mockProduct: Product = {
        id: 'p1',
        name: 'Test Product',
        description: 'Description',
        price: 100,
        stock: 10,
        imageUrl: 'http://example.com/image.jpg',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    describe('createProduct', () => {
        it('should create a product and invalidate cache', async () => {
            const createDto: CreateProductDTO = {
                name: 'New Product',
                description: 'New Description',
                price: 50,
                stock: 20,
            };
            mockProductRepository.createProduct.mockResolvedValueOnce({ ...mockProduct, ...createDto, id: 'p_new' });

            const result = await productService.createProduct(createDto);

            expect(mockProductRepository.createProduct).toHaveBeenCalledWith(createDto);
            expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
            expect(result).toHaveProperty('name', 'New Product');
        });
    });

    describe('getProducts', () => {
        it('should return products from cache if available', async () => {
            mockCache.get.mockReturnValueOnce([mockProduct]);

            const result = await productService.getProducts(1, 10, {});

            expect(mockCache.get).toHaveBeenCalledWith('products:page-1:limit-10:filters-{}');
            expect(mockProductRepository.getProducts).not.toHaveBeenCalled();
            expect(result).toEqual([mockProduct]);
        });

        it('should fetch products from repository and cache if not in cache', async () => {
            mockCache.get.mockReturnValueOnce(undefined);
            mockProductRepository.getProducts.mockResolvedValueOnce([mockProduct]);

            const result = await productService.getProducts(1, 10, {});

            expect(mockCache.get).toHaveBeenCalledWith('products:page-1:limit-10:filters-{}');
            expect(mockProductRepository.getProducts).toHaveBeenCalledWith(1, 10, {});
            expect(mockCache.set).toHaveBeenCalledWith('products:page-1:limit-10:filters-{}', [mockProduct]);
            expect(result).toEqual([mockProduct]);
        });
    });

    describe('getProductById', () => {
        it('should return product from cache if available', async () => {
            mockCache.get.mockReturnValueOnce(mockProduct);

            const result = await productService.getProductById('p1');

            expect(mockCache.get).toHaveBeenCalledWith('product:p1');
            expect(mockProductRepository.getProductById).not.toHaveBeenCalled();
            expect(result).toEqual(mockProduct);
        });

        it('should fetch product from repository and cache if not in cache', async () => {
            mockCache.get.mockReturnValueOnce(undefined);
            mockProductRepository.getProductById.mockResolvedValueOnce(mockProduct);

            const result = await productService.getProductById('p1');

            expect(mockCache.get).toHaveBeenCalledWith('product:p1');
            expect(mockProductRepository.getProductById).toHaveBeenCalledWith('p1');
            expect(mockCache.set).toHaveBeenCalledWith('product:p1', mockProduct);
            expect(result).toEqual(mockProduct);
        });

        it('should throw ApiError if product not found', async () => {
            mockCache.get.mockReturnValueOnce(undefined);
            mockProductRepository.getProductById.mockResolvedValueOnce(null);

            await expect(productService.getProductById('nonexistent')).rejects.toThrow(ApiError);
            await expect(productService.getProductById('nonexistent')).rejects.toHaveProperty('statusCode', 404);
        });
    });

    describe('updateProduct', () => {
        it('should update a product and invalidate relevant caches', async () => {
            const updateDto: UpdateProductDTO = { price: 120 };
            mockProductRepository.getProductById.mockResolvedValueOnce(mockProduct);
            mockProductRepository.updateProduct.mockResolvedValueOnce({ ...mockProduct, price: 120 });

            const result = await productService.updateProduct('p1', updateDto);

            expect(mockProductRepository.getProductById).toHaveBeenCalledWith('p1');
            expect(mockProductRepository.updateProduct).toHaveBeenCalledWith('p1', updateDto);
            expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
            expect(mockCache.del).toHaveBeenCalledWith('product:p1');
            expect(result).toHaveProperty('price', 120);
        });

        it('should throw ApiError if product to update not found', async () => {
            mockProductRepository.getProductById.mockResolvedValueOnce(null);

            await expect(productService.updateProduct('nonexistent', { price: 120 })).rejects.toThrow(ApiError);
        });
    });

    describe('deleteProduct', () => {
        it('should delete a product and invalidate relevant caches', async () => {
            mockProductRepository.getProductById.mockResolvedValueOnce(mockProduct);
            mockProductRepository.deleteProduct.mockResolvedValueOnce(mockProduct);

            const result = await productService.deleteProduct('p1');

            expect(mockProductRepository.getProductById).toHaveBeenCalledWith('p1');
            expect(mockProductRepository.deleteProduct).toHaveBeenCalledWith('p1');
            expect(mockCache.delByPattern).toHaveBeenCalledWith('products:*');
            expect(mockCache.del).toHaveBeenCalledWith('product:p1');
            expect(result).toEqual(mockProduct);
        });

        it('should throw ApiError if product to delete not found', async () => {
            mockProductRepository.getProductById.mockResolvedValueOnce(null);

            await expect(productService.deleteProduct('nonexistent')).rejects.toThrow(ApiError);
        });
    });
});
```

#### **5.3. `backend/src/routes/product.routes.test.ts` (Integration Test Example)**

```typescript