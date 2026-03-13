```typescript
import { Request, Response, NextFunction } from 'express';
import * as productService from '../services/product.service';
import { CustomError } from '../utils/errors';
import cache from '../utils/cache';

const PRODUCTS_CACHE_PREFIX = 'products_'; // Key will be products_category_search_limit_offset

export const getAllProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search, limit, offset } = req.query;

    const limitNum = limit ? parseInt(limit as string, 10) : 10;
    const offsetNum = offset ? parseInt(offset as string, 10) : 0;
    const categoryName = category as string | undefined;
    const searchTerm = search as string | undefined;

    const cacheKey = `${PRODUCTS_CACHE_PREFIX}${categoryName || 'all'}_${searchTerm || 'all'}_${limitNum}_${offsetNum}`;
    const cachedProducts = cache.get(cacheKey);
    if (cachedProducts) {
      return res.status(200).json(cachedProducts);
    }

    const result = await productService.findAllProducts(categoryName, searchTerm, limitNum, offsetNum);
    cache.set(cacheKey, result); // Cache the result

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const product = await productService.findProductById(id);

    if (!product) {
      throw new CustomError('Product not found', 404);
    }

    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, price, stock, categoryId } = req.body;

    if (!name || !price || stock === undefined || stock === null || !categoryId) {
      throw new CustomError('Name, price, stock, and categoryId are required', 400);
    }

    const newProduct = await productService.createProduct({ name, description, price, stock, categoryId });
    cache.keys().forEach(key => key.startsWith(PRODUCTS_CACHE_PREFIX) && cache.del(key)); // Invalidate all product caches

    res.status(201).json(newProduct);
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, categoryId } = req.body;

    if (!name || !price || stock === undefined || stock === null || !categoryId) {
      throw new CustomError('Name, price, stock, and categoryId are required for update', 400);
    }

    const updatedProduct = await productService.updateProduct(id, { name, description, price, stock, categoryId });
    cache.keys().forEach(key => key.startsWith(PRODUCTS_CACHE_PREFIX) && cache.del(key)); // Invalidate all product caches

    res.status(200).json(updatedProduct);
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await productService.deleteProduct(id);
    cache.keys().forEach(key => key.startsWith(PRODUCTS_CACHE_PREFIX) && cache.del(key)); // Invalidate all product caches

    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};
```