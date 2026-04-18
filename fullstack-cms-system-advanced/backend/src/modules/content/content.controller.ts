import { Router, Request, Response, NextFunction } from 'express';
import { ContentService } from './content.service';
import { CreateContentDto, UpdateContentDto } from './content.dtos';
import { validateRequest } from '../../utils/validation';
import { authMiddleware, authorize } from '../../middlewares/auth.middleware';
import { cacheMiddleware, clearCacheMiddleware } from '../../middlewares/cache.middleware';
import { UnauthorizedException } from '../../middlewares/error.middleware';

const router = Router();
const contentService = new ContentService();

const CONTENT_CACHE_PREFIX = 'content';

// Public endpoint for published content
router.get(
  '/',
  cacheMiddleware(CONTENT_CACHE_PREFIX, 60), // Cache for 1 minute (public content updates less frequently)
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const content = await contentService.getAllContent(false); // Only published content
      res.status(200).json(content);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:idOrSlug',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let content;
      if (req.params.idOrSlug.length === 36 && req.params.idOrSlug.includes('-')) { // Basic check for UUID format
        content = await contentService.getContentById(req.params.idOrSlug, false);
      } else {
        content = await contentService.getContentBySlug(req.params.idOrSlug, false);
      }
      res.status(200).json(content);
    } catch (error) {
      next(error);
    }
  }
);

// Protected routes (require authentication and authorization)
router.use(authMiddleware);

// Get all content (including drafts) - for authenticated users with permission
router.get(
  '/admin/all',
  authorize(['admin', 'editor']),
  clearCacheMiddleware(CONTENT_CACHE_PREFIX), // This endpoint fetches sensitive data, don't cache or be very careful
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const content = await contentService.getAllContent(true); // Include drafts
      res.status(200).json(content);
    } catch (error) {
      next(error);
    }
  }
);

// Get content by ID/Slug (including drafts) - for authenticated users with permission
router.get(
  '/admin/:idOrSlug',
  authorize(['admin', 'editor']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let content;
      if (req.params.idOrSlug.length === 36 && req.params.idOrSlug.includes('-')) {
        content = await contentService.getContentById(req.params.idOrSlug, true); // Include drafts
      } else {
        content = await contentService.getContentBySlug(req.params.idOrSlug, true); // Include drafts
      }
      res.status(200).json(content);
    } catch (error) {
      next(error);
    }
  }
);


router.post(
  '/',
  authorize(['admin', 'editor']),
  validateRequest(CreateContentDto),
  clearCacheMiddleware(CONTENT_CACHE_PREFIX), // Clear public content cache on new content
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedException('User not authenticated.');
      const newContent = await contentService.createContent(req.body as CreateContentDto, req.user.id);
      res.status(201).json(newContent);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  authorize(['admin', 'editor']),
  validateRequest(UpdateContentDto),
  clearCacheMiddleware(CONTENT_CACHE_PREFIX), // Clear public content cache on update
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const updatedContent = await contentService.updateContent(req.params.id, req.body as UpdateContentDto);
      res.status(200).json(updatedContent);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authorize(['admin']), // Only admin can delete content
  clearCacheMiddleware(CONTENT_CACHE_PREFIX), // Clear public content cache on delete
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await contentService.deleteContent(req.params.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export const contentRouter = router;