import productRepository from '../repositories/product.repository';
import { CreateProductDTO, UpdateProductDTO, Product } from '../types';
import { ApiError } from '../middlewares/errorHandler';
import cache from '../utils/cache';
import logger from '../config/logger';

class ProductService {
    private readonly PRODUCTS_CACHE_KEY_PATTERN = 'products:*'; // Pattern for product list cache keys
    private readonly PRODUCT_DETAIL_CACHE_KEY = (id: string) => `product:${id}`;

    async createProduct(data: CreateProductDTO): Promise<Product> {
        const product = await productRepository.createProduct(data);
        cache.delByPattern(this.PRODUCTS_CACHE_KEY_PATTERN); // Invalidate product list caches
        logger.info(`Product created: ${product.name}`);
        return product;
    }

    async getProducts(
        page: number,
        limit: number,
        filters: { name?: string; minPrice?: number; maxPrice?: number; isActive?: boolean }
    ): Promise<Product[]> {
        const cacheKey = `products:page-${page}:limit-${limit}:filters-${JSON.stringify(filters)}`;
        const cachedProducts = cache.get<Product[]>(cacheKey);
        if (cachedProducts) {
            logger.debug(`Cache hit for products: ${cacheKey}`);
            return cachedProducts;
        }

        const products = await productRepository.getProducts(page, limit, filters);
        cache.set(cacheKey, products);
        logger.debug(`Cache miss for products: ${cacheKey}, data fetched from DB.`);
        return products;
    }

    async getProductById(id: string): Promise<Product> {
        const cacheKey = this.PRODUCT_DETAIL_CACHE_KEY(id);
        const cachedProduct = cache.get<Product>(cacheKey);
        if (cachedProduct) {
            logger.debug(`Cache hit for product detail: ${cacheKey}`);
            return cachedProduct;
        }

        const product = await productRepository.getProductById(id);
        if (!product) {
            throw new ApiError(404, 'Product not found.');
        }
        cache.set(cacheKey, product);
        logger.debug(`Cache miss for product detail: ${cacheKey}, data fetched from DB.`);
        return product;
    }

    async updateProduct(id: string, data: UpdateProductDTO): Promise<Product> {
        const existingProduct = await productRepository.getProductById(id);
        if (!existingProduct) {
            throw new ApiError(404, 'Product not found.');
        }

        const product = await productRepository.updateProduct(id, data);
        cache.delByPattern(this.PRODUCTS_CACHE_KEY_PATTERN); // Invalidate product list caches
        cache.del(this.PRODUCT_DETAIL_CACHE_KEY(id)); // Invalidate specific product detail cache
        logger.info(`Product updated: ${product.name}`);
        return product;
    }

    async deleteProduct(id: string): Promise<Product> {
        const existingProduct = await productRepository.getProductById(id);
        if (!existingProduct) {
            throw new ApiError(404, 'Product not found.');
        }

        const product = await productRepository.deleteProduct(id);
        cache.delByPattern(this.PRODUCTS_CACHE_KEY_PATTERN); // Invalidate product list caches
        cache.del(this.PRODUCT_DETAIL_CACHE_KEY(id)); // Invalidate specific product detail cache
        logger.info(`Product deleted: ${product.name}`);
        return product;
    }
}

export default new ProductService();