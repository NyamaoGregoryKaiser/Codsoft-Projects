```typescript
import { AppDataSource } from '../database/data-source';
import { Product } from '../database/entities/Product';
import { Category } from '../database/entities/Category';
import { CustomError } from '../utils/errors';
import logger from '../utils/logger';
import { ILike } from 'typeorm';

const productRepository = AppDataSource.getRepository(Product);
const categoryRepository = AppDataSource.getRepository(Category);

interface CreateProductDto {
  name: string;
  description: string | null;
  price: number;
  stock: number;
  categoryId: string | null;
}

interface UpdateProductDto extends CreateProductDto {}

export const findAllProducts = async (
  categoryName?: string,
  searchTerm?: string,
  limit: number = 10,
  offset: number = 0
): Promise<{ products: Product[]; total: number; limit: number; offset: number }> => {
  logger.debug(`Fetching all products with filters: category=${categoryName}, search=${searchTerm}, limit=${limit}, offset=${offset}`);

  const queryBuilder = productRepository.createQueryBuilder('product');
  queryBuilder.leftJoinAndSelect('product.category', 'category');

  if (categoryName) {
    queryBuilder.andWhere('category.name ILIKE :categoryName', { categoryName: `%${categoryName}%` });
  }

  if (searchTerm) {
    queryBuilder.andWhere(
      '(product.name ILIKE :searchTerm OR product.description ILIKE :searchTerm)',
      { searchTerm: `%${searchTerm}%` }
    );
  }

  const [products, total] = await queryBuilder
    .skip(offset)
    .take(limit)
    .getManyAndCount();

  return { products, total, limit, offset };
};

export const findProductById = async (id: string): Promise<Product | null> => {
  logger.debug(`Fetching product by ID: ${id}`);
  const product = await productRepository.findOne({
    where: { id },
    relations: ['category'],
  });
  if (!product) {
    throw new CustomError(`Product with ID ${id} not found`, 404);
  }
  return product;
};

export const createProduct = async (productDto: CreateProductDto): Promise<Product> => {
  const existingProduct = await productRepository.findOneBy({ name: productDto.name });
  if (existingProduct) {
    throw new CustomError(`Product with name "${productDto.name}" already exists`, 400);
  }

  let category: Category | null = null;
  if (productDto.categoryId) {
    category = await categoryRepository.findOneBy({ id: productDto.categoryId });
    if (!category) {
      throw new CustomError(`Category with ID ${productDto.categoryId} not found`, 404);
    }
  }

  const newProduct = productRepository.create({
    ...productDto,
    category: category,
  });

  return productRepository.save(newProduct);
};

export const updateProduct = async (id: string, productDto: UpdateProductDto): Promise<Product> => {
  const productToUpdate = await productRepository.findOneBy({ id });
  if (!productToUpdate) {
    throw new CustomError(`Product with ID ${id} not found`, 404);
  }

  // Check if new name already exists for another product
  const existingProductWithName = await productRepository
    .createQueryBuilder('product')
    .where('product.name = :name', { name: productDto.name })
    .andWhere('product.id != :id', { id })
    .getOne();

  if (existingProductWithName) {
    throw new CustomError(`Product with name "${productDto.name}" already exists`, 400);
  }

  let category: Category | null = null;
  if (productDto.categoryId) {
    category = await categoryRepository.findOneBy({ id: productDto.categoryId });
    if (!category) {
      throw new CustomError(`Category with ID ${productDto.categoryId} not found`, 404);
    }
  } else if (productDto.categoryId === null) {
      // Explicitly setting categoryId to null
      category = null;
  }


  Object.assign(productToUpdate, { ...productDto, category: category });
  return productRepository.save(productToUpdate);
};

export const deleteProduct = async (id: string): Promise<void> => {
  const productToDelete = await productRepository.findOneBy({ id });
  if (!productToDelete) {
    throw new CustomError(`Product with ID ${id} not found`, 404);
  }
  await productRepository.remove(productToDelete);
};
```