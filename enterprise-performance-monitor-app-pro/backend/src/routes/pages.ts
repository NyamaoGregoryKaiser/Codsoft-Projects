import { Router } from 'express';
import {
  createPage,
  getPagesByApplication,
  getPageById,
  updatePage,
  deletePage
} from '../controllers/page';
import { authenticate, authorizeApplicationOwner } from '../middleware/auth';
import { createPageValidation, validate } from '../utils/validation';

const router = Router();

// Routes nested under /applications/:applicationId/pages
router.route('/:applicationId/pages')
  .post(authenticate, authorizeApplicationOwner, createPageValidation, validate, createPage)
  .get(authenticate, authorizeApplicationOwner, getPagesByApplication);

router.route('/:applicationId/pages/:pageId')
  .get(authenticate, authorizeApplicationOwner, getPageById)
  .put(authenticate, authorizeApplicationOwner, createPageValidation, validate, updatePage) // Reusing validation
  .delete(authenticate, authorizeApplicationOwner, deletePage);

export default router;