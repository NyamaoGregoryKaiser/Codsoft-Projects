import { Request, Response, NextFunction } from 'express';
import productService from '../services/product.service';
import { CreateProductDTO, UpdateProductDTO } from '../types';
import { ApiError } from '../middlewares/errorHandler';
import logger from '../config/logger';

class ProductController {
    async createProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productData: CreateProductDTO = req.body;
            // Basic validation (more robust validation with Zod recommended)
            if (!productData.name || !productData.price || !productData.stock) {
                throw new ApiError(400, 'Name, price, and stock are required.');
            }
            if (productData.price <= 0 || productData.stock < 0) {
                throw new ApiError(400, 'Price must be positive, stock non-negative.');
            }

            const product = await productService.createProduct(productData);
            res.status(201).json(product);
        } catch (error) {
            next(error);
        }
    }

    async getProducts(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 10;
            const name = req.query.name as string | undefined;
            const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
            const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
            const isActive = req.query.isActive ? (req.query.isActive === 'true') : undefined;

            const products = await productService.getProducts(page, limit, { name, minPrice, maxPrice, isActive });
            res.status(200).json(products);
        } catch (error) {
            next(error);
        }
    }

    async getProductById(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.id;
            const product = await productService.getProductById(productId);
            res.status(200).json(product);
        } catch (error) {
            next(error);
        }
    }

    async updateProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.id;
            const productData: UpdateProductDTO = req.body;

            const updatedProduct = await productService.updateProduct(productId, productData);
            res.status(200).json(updatedProduct);
        } catch (error) {
            next(error);
        }
    }

    async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const productId = req.params.id;
            await productService.deleteProduct(productId);
            res.status(204).send(); // No content
        } catch (error) {
            next(error);
        }
    }
}

export default new ProductController();