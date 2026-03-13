```typescript
import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/product.controller';
import { protect, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../types/enums';

const router = Router();

// Public routes (anyone authenticated can view, includes pagination/filters)
router.get('/', protect, getAllProducts);
router.get('/:id', protect, getProductById);

// Admin-only routes
router.post('/', protect, authorize([UserRole.ADMIN]), createProduct);
router.put('/:id', protect, authorize([UserRole.ADMIN]), updateProduct);
router.delete('/:id', protect, authorize([UserRole.ADMIN]), deleteProduct);

export default router;
```