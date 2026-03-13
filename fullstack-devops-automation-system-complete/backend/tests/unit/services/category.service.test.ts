```typescript
import { AppDataSource } from '../../../src/database/data-source';
import { Category } from '../../../src/database/entities/Category';
import { Product } from '../../../src/database/entities/Product'; // Assuming Product has a relation to Category
import { CustomError } from '../../../src/utils/errors';
import * as categoryService from '../../../src/services/category.service';
import { Repository } from 'typeorm';

// Mock TypeORM repositories
const mockCategoryRepository: Partial<Repository<Category>> = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  })),
  findOne: jest.fn(), // For deleteCategory's relations
};

// Mock AppDataSource to return the mocked repository
jest.mock('../../../src/database/data-source', () => ({
  AppDataSource: {
    getRepository: jest.fn((entity) => {
      if (entity === Category) return mockCategoryRepository;
      return {}; // Return empty object for other entities if not needed
    }),
  },
}));

describe('Category Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllCategories', () => {
    it('should return all categories', async () => {
      const categories = [
        { id: 'cat1', name: 'Electronics' },
        { id: 'cat2', name: 'Books' },
      ] as Category[];
      (mockCategoryRepository.find as jest.Mock).mockResolvedValue(categories);

      const result = await categoryService.findAllCategories();

      expect(mockCategoryRepository.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(categories);
    });
  });

  describe('findCategoryById', () => {
    it('should return a category if found', async () => {
      const category = { id: 'cat1', name: 'Electronics' } as Category;
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(category);

      const result = await categoryService.findCategoryById('cat1');

      expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: 'cat1' });
      expect(result).toEqual(category);
    });

    it('should throw CustomError if category not found', async () => {
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(categoryService.findCategoryById('nonexistent')).rejects.toThrow(
        new CustomError('Category with ID nonexistent not found', 404)
      );
    });
  });

  describe('createCategory', () => {
    it('should create and return a new category', async () => {
      const newCategoryData = { name: 'New Category' };
      const createdCategory = { id: 'new-cat-id', ...newCategoryData } as Category;

      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(null);
      (mockCategoryRepository.create as jest.Mock).mockReturnValue(createdCategory);
      (mockCategoryRepository.save as jest.Mock).mockResolvedValue(createdCategory);

      const result = await categoryService.createCategory(newCategoryData.name);

      expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ name: newCategoryData.name });
      expect(mockCategoryRepository.create).toHaveBeenCalledWith(newCategoryData);
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(createdCategory);
      expect(result).toEqual(createdCategory);
    });

    it('should throw CustomError if category name already exists', async () => {
      const existingCategory = { id: 'cat1', name: 'Electronics' } as Category;
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(existingCategory);

      await expect(categoryService.createCategory('Electronics')).rejects.toThrow(
        new CustomError('Category with name "Electronics" already exists', 400)
      );
      expect(mockCategoryRepository.create).not.toHaveBeenCalled();
      expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update and return the category', async () => {
      const categoryId = 'cat1';
      const updatedName = 'Updated Electronics';
      const existingCategory = { id: categoryId, name: 'Electronics' } as Category;
      const savedCategory = { ...existingCategory, name: updatedName } as Category;

      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(existingCategory);
      (mockCategoryRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(null); // No other category with same name
      (mockCategoryRepository.save as jest.Mock).mockResolvedValue(savedCategory);

      const result = await categoryService.updateCategory(categoryId, updatedName);

      expect(mockCategoryRepository.findOneBy).toHaveBeenCalledWith({ id: categoryId });
      expect(mockCategoryRepository.createQueryBuilder().where).toHaveBeenCalledWith('category.name = :name', { name: updatedName });
      expect(mockCategoryRepository.createQueryBuilder().andWhere).toHaveBeenCalledWith('category.id != :id', { id: categoryId });
      expect(mockCategoryRepository.save).toHaveBeenCalledWith(expect.objectContaining({ id: categoryId, name: updatedName }));
      expect(result).toEqual(savedCategory);
    });

    it('should throw CustomError if category to update not found', async () => {
      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(null);

      await expect(categoryService.updateCategory('nonexistent', 'New Name')).rejects.toThrow(
        new CustomError('Category with ID nonexistent not found', 404)
      );
    });

    it('should throw CustomError if new name conflicts with another category', async () => {
      const categoryId = 'cat1';
      const updatedName = 'Existing Category Name';
      const existingCategory = { id: categoryId, name: 'Original Name' } as Category;
      const conflictingCategory = { id: 'cat2', name: updatedName } as Category;

      (mockCategoryRepository.findOneBy as jest.Mock).mockResolvedValue(existingCategory);
      (mockCategoryRepository.createQueryBuilder().getOne as jest.Mock).mockResolvedValue(conflictingCategory);

      await expect(categoryService.updateCategory(categoryId, updatedName)).rejects.toThrow(
        new CustomError(`Category with name "${updatedName}" already exists`, 400)
      );
      expect(mockCategoryRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('deleteCategory', () => {
    it('should delete a category if found and no products associated', async () => {
      const categoryId = 'cat1';
      const categoryToDelete = { id: categoryId, name: 'Electronics', products: [] } as Category;

      (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(categoryToDelete);
      (mockCategoryRepository.remove as jest.Mock).mockResolvedValue(undefined);

      await expect(categoryService.deleteCategory(categoryId)).resolves.toBeUndefined();

      expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
        where: { id: categoryId },
        relations: ['products'],
      });
      expect(mockCategoryRepository.remove).toHaveBeenCalledWith(categoryToDelete);
    });

    it('should delete a category if found and products are associated (due to SET NULL)', async () => {
        const categoryId = 'cat1';
        const categoryToDelete = { id: categoryId, name: 'Electronics', products: [{id: 'prod1'}] } as Category;

        (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(categoryToDelete);
        (mockCategoryRepository.remove as jest.Mock).mockResolvedValue(undefined);

        await expect(categoryService.deleteCategory(categoryId)).resolves.toBeUndefined();

        expect(mockCategoryRepository.findOne).toHaveBeenCalledWith({
            where: { id: categoryId },
            relations: ['products'],
        });
        expect(mockCategoryRepository.remove).toHaveBeenCalledWith(categoryToDelete);
        // This test implies that the DB will handle SET NULL, no business logic error for associated products
    });

    it('should throw CustomError if category to delete not found', async () => {
      (mockCategoryRepository.findOne as jest.Mock).mockResolvedValue(null);

      await expect(categoryService.deleteCategory('nonexistent')).rejects.toThrow(
        new CustomError('Category with ID nonexistent not found', 404)
      );
      expect(mockCategoryRepository.remove).not.toHaveBeenCalled();
    });
  });
});
```