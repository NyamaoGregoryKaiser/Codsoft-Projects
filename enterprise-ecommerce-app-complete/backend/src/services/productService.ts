```typescript
import { Product, ProductStatus } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/errorHandler';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/cache';
import logger from '../utils/logger';

interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  status?: ProductStatus;
}

interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  categoryId?: string;
  imageUrl?: string;
  status?: ProductStatus;
}

interface ListProductsFilters {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'createdAt' | 'price' | 'name' | 'stock';
  sortOrder?: 'asc' | 'desc';
  status?: ProductStatus;
}

const PRODUCTS_CACHE_PREFIX = 'products';
const PRODUCT_DETAIL_CACHE_PREFIX = 'product:';

export const productService = {
  /**
   * Creates a new product.
   * @param data Product creation data.
   * @returns The newly created product.
   */
  async createProduct(data: CreateProductInput): Promise<Product> {
    const product = await prisma.product.create({ data });
    await clearCacheByPattern(`${PRODUCTS_CACHE_PREFIX}:*`); // Invalidate product list caches
    return product;
  },

  /**
   * Retrieves a product by its ID. Uses caching.
   * @param id The product ID.
   * @returns The product, or null if not found.
   */
  async getProductById(id: string): Promise<Product | null> {
    const cacheKey = `${PRODUCT_DETAIL_CACHE_PREFIX}${id}`;
    const cachedProduct = await getCache<Product>(cacheKey);

    if (cachedProduct) {
      return cachedProduct;
    }

    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, reviews: { include: { user: { select: { id: true, firstName: true, lastName: true } } } } },
    });

    if (product) {
      await setCache(cacheKey, product, 3600); // Cache for 1 hour
    }
    return product;
  },

  /**
   * Retrieves a list of products with pagination, filtering, and sorting. Uses caching.
   * @param filters Filters for product listing.
   * @returns An object containing products, total count, and pagination info.
   */
  async listProducts(filters: ListProductsFilters): Promise<{ products: Product[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 10, category, search, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc', status } = filters;
    const skip = (page - 1) * limit;

    const cacheKey = `${PRODUCTS_CACHE_PREFIX}:page-${page}:limit-${limit}:category-${category || 'all'}:search-${search || 'none'}:minP-${minPrice || 'none'}:maxP-${maxPrice || 'none'}:sortBy-${sortBy}:sortOrder-${sortOrder}:status-${status || 'all'}`;
    const cachedResult = await getCache<{ products: Product[]; total: number }>(cacheKey);

    if (cachedResult) {
      logger.debug(`Cache hit for product list: ${cacheKey}`);
      return { ...cachedResult, page, limit };
    }

    const where: any = {};
    if (category) {
      where.categoryId = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: minPrice };
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: maxPrice };
    }
    if (status) {
      where.status = status;
    }

    const products = await prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        category: true, // Eager loading category for listing
      },
    });

    const total = await prisma.product.count({ where });

    await setCache(cacheKey, { products, total }, 600); // Cache for 10 minutes
    return { products, total, page, limit };
  },

  /**
   * Updates an existing product.
   * @param id The product ID.
   * @param data Update data.
   * @returns The updated product.
   */
  async updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new AppError('Product not found.', 404);
    }
    const updatedProduct = await prisma.product.update({
      where: { id },
      data,
    });
    await deleteCache(PRODUCT_DETAIL_CACHE_PREFIX + id); // Invalidate specific product cache
    await clearCacheByPattern(`${PRODUCTS_CACHE_PREFIX}:*`); // Invalidate product list caches
    return updatedProduct;
  },

  /**
   * Deletes a product.
   * @param id The product ID.
   */
  async deleteProduct(id: string): Promise<void> {
    const existingProduct = await prisma.product.findUnique({ where: { id } });
    if (!existingProduct) {
      throw new AppError('Product not found.', 404);
    }
    await prisma.product.delete({ where: { id } });
    await deleteCache(PRODUCT_DETAIL_CACHE_PREFIX + id); // Invalidate specific product cache
    await clearCacheByPattern(`${PRODUCTS_CACHE_PREFIX}:*`); // Invalidate product list caches
  },
};
```