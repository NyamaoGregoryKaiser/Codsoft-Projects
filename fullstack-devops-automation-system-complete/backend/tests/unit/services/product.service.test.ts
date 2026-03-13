```typescript
import { AppDataSource } from '../../../src/database/data-source';
import { Product } from '../../../src/database/entities/Product';
import { Category } from '../../../src/database/entities/Category';
import { CustomError } from '../../../src/utils/errors';
import * as productService from '../../../src/services/product.service';
import { Repository } from 'typeorm';

// Mock TypeORM repositories
const mockProductRepository: Partial<Repository<Product>> = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
    where: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  })),
};

const mockCategoryRepository: Partial<Repository<Category>> = {
  findOneBy: jest.fn(),
};

// Mock AppDataSource to return the mocked repositories
jest.mock('../../../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === Product) return mockProductRepository;
      if (entity === Category) return mockCategoryRepository;
      return {};
    }),
  },
}));

describe('Product Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockCategory = { id: 'cat1', name: 'Electronics' } as Category;

  describe('findAllProducts', () => {
    it('should return all products with pagination', async () => {
      const products = [{ id: 'prod1', name: 'Laptop', category: mockCategory }] as Product[];
      (mockProductRepository.createQueryBuilder().getManyAndCount as jest.Mock).mockResolvedValue([products, 1]);

      const result = await productService.findAllProducts(undefined, undefined, 10, 0);

      expect(mockProductRepository.createQueryBuilder).toHaveBeenCalled();
      expect(mockProductRepository.createQueryBuilder().leftJoinAndSelect).toHaveBeenCalledWith('product.category', 'category');
      expect(mockProductRepository.createQueryBuilder().skip).toHaveBeenCalledWith(0);
      expect(mockProductRepository.createQueryBuilder().take).toHaveBeenCalledWith(10);
      expect(result).toEqual({ products, total: 1, limit: 10, offset: 0 });
    });

    it('should filter products by category name', async () => {
      const products = [{ id: 'prod1', name: 'Laptop', category: mockCategory }] as Product[];
      (mockProductRepository.createQueryBuilder().getManyAndCount as jest.Mock).mockResolvedValue([products, 1]);

      await productService.findAllProducts('Electronics', undefined, 10, 0);

      expect(mockProductRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith('category.name ILIKE :categoryName', { categoryName: '%Electronics%' });
    });

    it('should search products by search term', async () => {
      const products = [{ id: 'prod1', name: 'Laptop', category: mockCategory }] as Product[];
      (mockProductRepository.createQueryBuilder().getManyAndCount as jest.Mock).mockResolvedValue([products, 1]);

      await productService.findAllProducts(undefined, 'laptop', 10, 0);

      expect(mockProductRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith(
        '(product.name ILIKE :searchTerm OR product.description ILIKE :searchTerm)',
        { searchTerm: '%laptop%' }
      );
    });
  });

  describe('findProductById', () => {
    it('should return a product if found', async () => {
      const product = { id: 'prod1', name: 'Laptop', category: mockCategory } as Product;
      (mockProductRepository.findOne as jest.Mock).mockResolvedValue(product);

      const result = await productService.findProductById('prod1');

      expect(mockProductRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'prod1' },
        relations: ['category'],
      });
      expect(result).toEqual(product);
    });

    it('should throw CustomError if product not found', async () => {
      (mockProductRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(productService.findProductById('nonexistent')).rejects.toThrow(
        new CustomError('Product with ID nonexistent not found', 404)
      );
    });
  });

  describe('createProduct', () => {
    const productDto = {
      name: 'New Product',
      description: 'Description',
      price: 100.00,
      stock: 50,
      categoryId: 'cat1',
    };

    it('should create and return a new product', async () => {
      const createdProduct = { id: 'new-prod-id', ...productDto, category: mockCategory } as Product;

      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(mockCategory);
      (mockProductRepository.create as jest.Mock).mockReturnValue(createdProduct);
      (mockProductRepository.save as jest.Mock).mockResolvedValue(createdProduct);

      const result = await productService.createProduct(productDto);

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ name: productDto.name });
      expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: productDto.categoryId });
      expect(mockProductRepository.create).toHaveBeenCalledWith({ ...productDto, category: mockCategory });
      expect(mockProductRepository.save).toHaveBeenCalledWith(createdProduct);
      expect(result).toEqual(createdProduct);
    });

    it('should throw CustomError if product name already exists', async () => {
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue({ id: 'existing-prod-id', name: productDto.name });

      await expect(productService.createProduct(productDto)).rejects.toThrow(
        new CustomError(`Product with name "${productDto.name}" already exists`, 400)
      );
      expect(mockProductRepository.create).not.toHaveBeenCalled();
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CustomError if category not found', async () => {
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(productService.createProduct(productDto)).rejects.toThrow(
        new CustomError(`Category with ID ${productDto.categoryId} not found`, 404)
      );
      expect(mockProductRepository.create).not.toHaveBeenCalled();
      expect(mockProductRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateProduct', () => {
    const productId = 'prod1';
    const updatedProductDto = {
      name: 'Updated Product Name',
      description: 'Updated Description',
      price: 150.00,
      stock: 60,
      categoryId: 'cat1',
    };
    const existingProduct = { id: productId, name: 'Old Name', category: mockCategory } as Product;

    it('should update and return the product', async () => {
      const savedProduct = { id: productId, ...updatedProductDto, category: mockCategory } as Product;

      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(existingProduct);
      (mockProductRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(null); // No name conflict
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(mockCategory);
      (mockProductRepository.save as jest.Mock).mockResolvedValue(savedProduct);

      const result = await productService.updateProduct(productId, updatedProductDto);

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: productId });
      expect(mockProductRepository.createQueryBuilder().where).toHaveBeenCalledWith('product.name = :name', { name: updatedProductDto.name });
      expect(mockProductRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith('product.id != :id', { id: productId});
      expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: updatedProductDto.categoryId });
      expect(mockProductRepository.save).toHaveBeenCalledWith(expect.objectContaining({ ...updatedProductDto, category: mockCategory }));
      expect(result).toEqual(savedProduct);
    });

    it('should throw CustomError if product to update not found', async () => {
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(productService.updateProduct('nonexistent', updatedProductDto)).rejects.toThrow(
        new CustomError('Product with ID nonexistent not found', 404)
      );
    });

    it('should throw CustomError if new name conflicts with another product', async () => {
        (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(existingProduct);
        (mockProductRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue({ id: 'another-prod-id', name: updatedProductDto.name });

        await expect(productService.updateProduct(productId, updatedProductDto)).rejects.toThrow(
            new CustomError(`Product with name "${updatedProductDto.name}" already exists`, 400)
        );
        expect(mockProductRepository.save).not.toHaveBeenCalled();
    });

    it('should throw CustomError if category not found for update', async () => {
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(existingProduct);
      (mockProductRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(null);
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(productService.updateProduct(productId, productDto)).rejects.toThrow(
        new CustomError(`Category with ID ${productDto.categoryId} not found`, 404)
      );
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product if found', async () => {
      const productToDelete = { id: 'prod1', name: 'Laptop' } as Product;
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(productToDelete);
      (mockProductRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await expect(productService.deleteProduct('prod1')).resolves.toBeUndefined();

      expect(mockProductRepository.findOneBy).toHaveBeenCalledWith({ id: 'prod1' });
      expect(mockProductRepository.remove).toHaveBeenCalledWith(productToDelete);
    });

    it('should throw CustomError if product to delete not found', async () => {
      (mockProductRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(productService.deleteProduct('nonexistent')).rejects.toThrow(
        new CustomError('Product with ID nonexistent not found', 404)
      );
      expect(mockProductRepository.remove).not.toHaveBeenCalled();
    });
  });
});
```