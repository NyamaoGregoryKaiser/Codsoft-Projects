import { Product } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';
import prisma from '../../config/database';
import { ApiError } from '../../middleware/error.middleware';
import { PaginationMeta } from '../../types';

interface ProductCreateData {
  name: string;
  description?: string;
  price: number;
  stock: number;
}

interface ProductUpdateData {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}

/**
 * Create a new product.
 * @param data
 * @returns {Product}
 */
export const createProduct = async (data: ProductCreateData): Promise<Product> => {
  const product = await prisma.product.create({ data });
  return product;
};

/**
 * Get all products with pagination.
 * @param offset
 * @param limit
 * @returns {{ products: Product[], meta: PaginationMeta }}
 */
export const getAllProducts = async (offset: number, limit: number): Promise<{ products: Product[], meta: PaginationMeta }> => {
  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count(),
  ]);

  return {
    products,
    meta: {
      total,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      pages: Math.ceil(total / limit),
    },
  };
};

/**
 * Get product by ID.
 * @param productId
 * @returns {Product}
 */
export const getProductById = async (productId: string): Promise<Product> => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  return product;
};

/**
 * Update product by ID.
 * @param productId
 * @param data
 * @returns {Product}
 */
export const updateProductById = async (productId: string, data: ProductUpdateData): Promise<Product> => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const updatedProduct = await prisma.product.update({
    where: { id: productId },
    data,
  });
  return updatedProduct;
};

/**
 * Delete product by ID.
 * @param productId
 * @returns {void}
 */
export const deleteProductById = async (productId: string): Promise<void> => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }
  await prisma.product.delete({ where: { id: productId } });
};