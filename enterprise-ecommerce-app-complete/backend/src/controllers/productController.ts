```typescript
import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/productService';
import { AppError } from '../utils/errorHandler';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema
} from '../utils/validators';
import { z } from 'zod';

// Helper to infer types from Zod schemas
type CreateProductBody = z.infer<typeof createProductSchema>['body'];
type UpdateProductParams = z.infer<typeof updateProductSchema>['params'];
type UpdateProductBody = z.infer<typeof updateProductSchema>['body'];
type GetProductParams = z.infer<typeof getProductSchema>['params'];
type ListProductsQuery = z.infer<typeof listProductsSchema>['query'];


export const productController = {
  async createProduct(req: Request<{}, {}, CreateProductBody>, res: Response, next: NextFunction) {
    try {
      // Validation already handled by middleware (e.g., validate(createProductSchema))
      const product = await productService.createProduct(req.body);
      res.status(201).json({
        status: 'success',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  },

  async getProduct(req: Request<GetProductParams>, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await productService.getProductById(id);

      if (!product) {
        return next(new AppError('Product not found.', 404));
      }

      res.status(200).json({
        status: 'success',
        data: { product },
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllProducts(req: Request<{}, {}, {}, ListProductsQuery>, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const { products, total, page, limit } = await productService.listProducts(filters);

      res.status(200).json({
        status: 'success',
        results: products.length,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
        data: { products },
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProduct(req: Request<UpdateProductParams, {}, UpdateProductBody>, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updatedProduct = await productService.updateProduct(id, req.body);

      res.status(200).json({
        status: 'success',
        data: { product: updatedProduct },
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteProduct(req: Request<GetProductParams>, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await productService.deleteProduct(id);

      res.status(204).json({
        status: 'success',
        data: null,
      });
    } catch (error) {
      next(error);
    }
  },
};
```