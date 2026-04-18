import { Router, Request, Response, NextFunction } from 'express';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dtos';
import { validateRequest } from '../../utils/validation';
import { authorize } from '../../middlewares/auth.middleware';
import { cacheMiddleware, clearCacheMiddleware } from '../../middlewares/cache.middleware';

const router = Router();
const categoryService = new CategoryService();

const CATEGORY_CACHE_PREFIX = 'categories';

router.get(
  '/',
  cacheMiddleware(CATEGORY_CACHE_PREFIX), // Cache categories list for better performance
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const categories = await categoryService.getAllCategories();
      res.status(200).json(categories);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.status(200).json(category);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authorize(['admin', 'editor']), // Only admin/editor can create categories
  validateRequest(CreateCategoryDto),
  clearCacheMiddleware(CATEGORY_CACHE_PREFIX), // Clear cache when categories are modified
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newCategory = await categoryService.createCategory(req.body as CreateCategoryDto);
      res.status(201).json(newCategory);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authorize(['admin', 'editor']), // Only admin/editor can update categories
  validateRequest(UpdateCategoryDto),
  clearCacheMiddleware(CATEGORY_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedCategory = await categoryService.updateCategory(req.params.id, req.body as UpdateCategoryDto);
      res.status(200).json(updatedCategory);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authorize(['admin']), // Only admin can delete categories (more restrictive)
  clearCacheMiddleware(CATEGORY_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await categoryService.deleteCategory(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export const categoryRouter = router;