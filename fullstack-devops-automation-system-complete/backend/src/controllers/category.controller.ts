```typescript
import { Request, Response, NextFunction } from 'express';
import * as categoryService from '../services/category.service';
import { CustomError } from '../utils/errors';
import cache from '../utils/cache';

const CATEGORIES_CACHE_KEY = 'all_categories';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cachedCategories = cache.get(CATEGORIES_CACHE_KEY);
    if (cachedCategories) {
      return res.status(200).json(cachedCategories);
    }

    const categories = await categoryService.findAllCategories();
    cache.set(CATEGORIES_CACHE_KEY, categories); // Cache the result

    res.status(200).json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const category = await categoryService.findCategoryById(id);

    if (!category) {
      throw new CustomError('Category not found', 404);
    }

    res.status(200).json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new CustomError('Name is required', 400);
    }

    const newCategory = await categoryService.createCategory(name);
    cache.del(CATEGORIES_CACHE_KEY); // Invalidate cache

    res.status(201).json(newCategory);
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      throw new CustomError('Name is required', 400);
    }

    const updatedCategory = await categoryService.updateCategory(id, name);
    cache.del(CATEGORIES_CACHE_KEY); // Invalidate cache

    res.status(200).json(updatedCategory);
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    cache.del(CATEGORIES_CACHE_KEY); // Invalidate cache

    res.status(204).send(); // No content
  } catch (error) {
    next(error);
  }
};
```