import prisma from '../models/prisma';
import { Product, CreateProductDTO, UpdateProductDTO } from '../types';
import logger from '../config/logger';

class ProductRepository {
    async createProduct(data: CreateProductDTO): Promise<Product> {
        try {
            return await prisma.product.create({ data });
        } catch (error) {
            logger.error('Error creating product:', error);
            throw error;
        }
    }

    async getProducts(
        page: number = 1,
        limit: number = 10,
        filters: { name?: string; minPrice?: number; maxPrice?: number; isActive?: boolean } = {}
    ): Promise<Product[]> {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters.name) {
            where.name = { contains: filters.name, mode: 'insensitive' };
        }
        if (filters.minPrice) {
            where.price = { gte: filters.minPrice };
        }
        if (filters.maxPrice) {
            where.price = { ...where.price, lte: filters.maxPrice };
        }
        if (filters.isActive !== undefined) {
            where.isActive = filters.isActive;
        }

        try {
            return await prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: { name: 'asc' }, // Default order
            });
        } catch (error) {
            logger.error('Error getting products:', error);
            throw error;
        }
    }

    async getProductById(id: string): Promise<Product | null> {
        try {
            return await prisma.product.findUnique({ where: { id } });
        } catch (error) {
            logger.error(`Error getting product by ID ${id}:`, error);
            throw error;
        }
    }

    async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
        try {
            return await prisma.product.update({ where: { id }, data });
        } catch (error) {
            logger.error(`Error updating product by ID ${id}:`, error);
            throw error;
        }
    }

    async deleteProduct(id: string): Promise<Product> {
        try {
            return await prisma.product.delete({ where: { id } });
        } catch (error) {
            logger.error(`Error deleting product by ID ${id}:`, error);
            throw error;
        }
    }
}

export default new ProductRepository();