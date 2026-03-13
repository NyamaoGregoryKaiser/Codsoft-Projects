```typescript
import { Router } from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// Public routes (anyone authenticated can view)
router.get('/', protect, getAllCategories);
router.get('/:id', protect, getCategoryById);

// Admin-only routes
router.post('/', protect, authorize([UserRole.ADMIN]), createCategory);
router.put('/:id', protect, authorize([UserRole.ADMIN]), updateCategory);
router.delete('/:id', protect, authorize([UserRole.ADMIN]), deleteCategory);

export default router;
```