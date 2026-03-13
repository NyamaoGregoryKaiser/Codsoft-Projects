```typescript
import { AppDataSource } from '../database/data-source';
import { Category } from '../database/entities/Category';
import { CustomError } from '../utils/errors';
import logger from '../utils/logger';

const categoryRepository = AppDataSource.getRepository(Category);

export const findAllCategories = async (): Promise<Category[]> => {
  logger.debug('Fetching all categories from DB...');
  return categoryRepository.find();
};

export const findCategoryById = async (id: string): Promise<Category | null> => {
  logger.debug(`Fetching category by ID: ${id}`);
  const category = await categoryRepository.findOneBy({ id });
  if (!category) {
    throw new CustomError(`Category with ID ${id} not found`, 404);
  }
  return category;
};

export const createCategory = async (name: string): Promise<Category> => {
  const existingCategory = await categoryRepository.findOneBy({ name });
  if (existingCategory) {
    throw new CustomError(`Category with name "${name}" already exists`, 400);
  }

  const newCategory = categoryRepository.create({ name });
  return categoryRepository.save(newCategory);
};

export const updateCategory = async (id: string, name: string): Promise<Category> => {
  const categoryToUpdate = await categoryRepository.findOneBy({ id });
  if (!categoryToUpdate) {
    throw new CustomError(`Category with ID ${id} not found`, 404);
  }

  const existingCategoryWithName = await categoryRepository
    .createQueryBuilder('category')
    .where('category.name = :name', { name })
    .andWhere('category.id != :id', { id })
    .getOne();

  if (existingCategoryWithName) {
    throw new CustomError(`Category with name "${name}" already exists`, 400);
  }

  categoryToUpdate.name = name;
  return categoryRepository.save(categoryToUpdate);
};

export const deleteCategory = async (id: string): Promise<void> => {
  const categoryToDelete = await categoryRepository.findOne({
    where: { id },
    relations: ['products'], // Load products to check for dependencies
  });

  if (!categoryToDelete) {
    throw new CustomError(`Category with ID ${id} not found`, 404);
  }

  // If products are associated, their categoryId will be SET NULL by DB constraint
  // We can add a business logic check here if we wanted to prevent deletion
  // if (categoryToDelete.products && categoryToDelete.products.length > 0) {
  //   throw new CustomError('Cannot delete category with associated products.', 409);
  // }

  await categoryRepository.remove(categoryToDelete);
};
```