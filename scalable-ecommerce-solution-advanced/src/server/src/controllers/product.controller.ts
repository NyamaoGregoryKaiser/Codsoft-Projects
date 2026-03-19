import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { productService } from '../services/product.service';

class ProductController {
  public async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const category = req.query.category as string;
      const { products, total, page: currentPage, limit: currentLimit } = await productService.getProducts(page, limit, category);
      res.status(StatusCodes.OK).json({
        data: products,
        meta: { total, page: currentPage, limit: currentLimit, totalPages: Math.ceil(total / currentLimit) },
      });
    } catch (error) {
      next(error);
    }
  }

  public async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.status(StatusCodes.OK).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      res.status(StatusCodes.CREATED).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      res.status(StatusCodes.OK).json(product);
    } catch (error) {
      next(error);
    }
  }

  public async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id);
      res.status(StatusCodes.NO_CONTENT).send(); // 204 No Content
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();