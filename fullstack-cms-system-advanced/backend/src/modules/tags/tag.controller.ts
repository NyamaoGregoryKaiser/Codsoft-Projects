import { Router, Request, Response, NextFunction } from 'express';
import { TagService } from './tag.service';
import { CreateTagDto, UpdateTagDto } from './tag.dtos';
import { validateRequest } from '../../utils/validation';
import { authorize } from '../../middlewares/auth.middleware';
import { cacheMiddleware, clearCacheMiddleware } from '../../middlewares/cache.middleware';

const router = Router();
const tagService = new TagService();

const TAGS_CACHE_PREFIX = 'tags';

router.get(
  '/',
  cacheMiddleware(TAGS_CACHE_PREFIX), // Cache tags list
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tags = await tagService.getAllTags();
      res.status(200).json(tags);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tag = await tagService.getTagById(req.params.id);
      res.status(200).json(tag);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authorize(['admin', 'editor']), // Only admin/editor can create tags
  validateRequest(CreateTagDto),
  clearCacheMiddleware(TAGS_CACHE_PREFIX), // Clear cache when tags are modified
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newTag = await tagService.createTag(req.body as CreateTagDto);
      res.status(201).json(newTag);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authorize(['admin', 'editor']), // Only admin/editor can update tags
  validateRequest(UpdateTagDto),
  clearCacheMiddleware(TAGS_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedTag = await tagService.updateTag(req.params.id, req.body as UpdateTagDto);
      res.status(200).json(updatedTag);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authorize(['admin']), // Only admin can delete tags
  clearCacheMiddleware(TAGS_CACHE_PREFIX),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await tagService.deleteTag(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export const tagRouter = router;