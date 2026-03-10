import httpStatus from 'http-status';
import { prisma } from '@models/prisma';
import { AppError } from '@utils/appError';
import { ProductMessages } from '@constants/messages';
import { CreateProductBody, UpdateProductBody } from '@validation/product.validation';
import { cacheService } from './cache.service';

const PRODUCT_CACHE_PREFIX = 'product:';
const PRODUCTS_LIST_CACHE_KEY = 'products:all';

/**
 * Create a product
 * @param {CreateProductBody} productBody
 * @returns {Promise<Product>}
 */
export const createProduct = async (productBody: CreateProductBody) => {
  const product = await prisma.product.create({ data: productBody });
  // Invalidate relevant cache entries
  await cacheService.delete(PRODUCTS_LIST_CACHE_KEY);
  return product;
};

/**
 * Get product by id
 * @param {string} id
 * @returns {Promise<Product>}
 */
export const getProductById = async (id: string) => {
  const cachedProduct = await cacheService.get<any>(`${PRODUCT_CACHE_PREFIX}${id}`);
  if (cachedProduct) {
    return cachedProduct;
  }

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError(httpStatus.NOT_FOUND, ProductMessages.PRODUCT_NOT_FOUND);
  }

  await cacheService.set(`${PRODUCT_CACHE_PREFIX}${id}`, product);
  return product;
};

/**
 * Query for products
 * @param {object} filter - Prisma filter
 * @param {object} options - Query options
 * @param {string} [options.sortBy] - Sort option in the format: sortField:(desc|asc)
 * @param {number} [options.limit] - Maximum number of results per page (default = 10)
 * @param {number} [options.page] - Current page (default = 1)
 * @returns {Promise<QueryResult>}
 */
export const queryProducts = async (
  filter: { name?: string; minPrice?: number; maxPrice?: number },
  options: { limit?: number; page?: number; sortBy?: string }
) => {
  const { limit = 10, page = 1, sortBy = 'createdAt:desc' } = options;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filter.name) {
    where.name = { contains: filter.name, mode: 'insensitive' };
  }
  if (filter.minPrice !== undefined) {
    where.price = { ...where.price, gte: filter.minPrice };
  }
  if (filter.maxPrice !== undefined) {
    where.price = { ...where.price, lte: filter.maxPrice };
  }

  const orderBy: any = {};
  const [field, order] = sortBy.split(':');
  orderBy[field] = order || 'desc';

  // For complex queries or pagination, caching the full result with filter might be more complex
  // For simplicity, we'll cache the entire list if no specific filters are applied.
  const isSimpleListQuery = Object.keys(filter).length === 0 && limit === 10 && page === 1 && sortBy === 'createdAt:desc';
  if (isSimpleListQuery) {
    const cachedProductsList = await cacheService.get<any>(PRODUCTS_LIST_CACHE_KEY);
    if (cachedProductsList) {
      return cachedProductsList; // Return cached list directly for simple queries
    }
  }

  const products = await prisma.product.findMany({
    where,
    skip,
    take: limit,
    orderBy,
  });

  const totalResults = await prisma.product.count({ where });
  const totalPages = Math.ceil(totalResults / limit);

  const result = { products, totalPages, currentPage: page, totalResults };

  if (isSimpleListQuery) {
    await cacheService.set(PRODUCTS_LIST_CACHE_KEY, result);
  }

  return result;
};

/**
 * Update product by id
 * @param {string} productId
 * @param {UpdateProductBody} updateBody
 * @returns {Promise<Product>}
 */
export const updateProductById = async (productId: string, updateBody: UpdateProductBody) => {
  await getProductById(productId); // Ensure product exists

  const product = await prisma.product.update({
    where: { id: productId },
    data: updateBody,
  });
  // Invalidate relevant cache entries
  await cacheService.delete(`${PRODUCT_CACHE_PREFIX}${productId}`);
  await cacheService.delete(PRODUCTS_LIST_CACHE_KEY); // Invalidate the list cache
  return product;
};

/**
 * Delete product by id
 * @param {string} productId
 * @returns {Promise<void>}
 */
export const deleteProductById = async (productId: string) => {
  await getProductById(productId); // Ensure product exists
  await prisma.product.delete({ where: { id: productId } });
  // Invalidate relevant cache entries
  await cacheService.delete(`${PRODUCT_CACHE_PREFIX}${productId}`);
  await cacheService.delete(PRODUCTS_LIST_CACHE_KEY); // Invalidate the list cache
};