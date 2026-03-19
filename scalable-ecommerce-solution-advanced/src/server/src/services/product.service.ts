import { AppDataSource } from '../database';
import { Product } from '../database/entities/Product.entity';
import { Category } from '../database/entities/Category.entity';
import ApiError from '../utils/ApiError';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../config/logger';

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl?: string;
  categoryIds?: string[];
}

interface UpdateProductData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  imageUrl?: string;
  isActive?: boolean;
  categoryIds?: string[];
}

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private categoryRepository = AppDataSource.getRepository(Category);

  public async getProducts(page: number = 1, limit: number = 10, category?: string) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.categories', 'category')
      .where('product.isActive = :isActive', { isActive: true })
      .skip(skip)
      .take(limit);

    if (category) {
      queryBuilder.andWhere('category.name ILIKE :categoryName', { categoryName: `%${category}%` });
    }

    const [products, total] = await queryBuilder.getManyAndCount();
    return { products, total, page, limit };
  }

  public async getProductById(id: string) {
    const product = await this.productRepository.findOne({
      where: { id, isActive: true },
      relations: ['categories'],
    });
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }
    return product;
  }

  public async createProduct(data: CreateProductData) {
    const { categoryIds, ...productData } = data;
    const newProduct = this.productRepository.create(productData);

    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.findBy({ id: categoryIds });
      if (categories.length !== categoryIds.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more categories not found');
      }
      newProduct.categories = categories;
    }

    await this.productRepository.save(newProduct);
    logger.info(`Product created: ${newProduct.name}`);
    return newProduct;
  }

  public async updateProduct(id: string, data: UpdateProductData) {
    const product = await this.productRepository.findOne({ where: { id }, relations: ['categories'] });
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }

    const { categoryIds, ...updateData } = data;
    Object.assign(product, updateData);

    if (categoryIds !== undefined) {
      const categories = await this.categoryRepository.findBy({ id: categoryIds });
      if (categories.length !== categoryIds.length) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'One or more categories not found');
      }
      product.categories = categories;
    }

    await this.productRepository.save(product);
    logger.info(`Product updated: ${product.name}`);
    return product;
  }

  public async deleteProduct(id: string) {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
    }
    await this.productRepository.remove(product);
    logger.info(`Product deleted: ${product.name}`);
    return { message: 'Product deleted successfully' };
  }
}

export const productService = new ProductService();