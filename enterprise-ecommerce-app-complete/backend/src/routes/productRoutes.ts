```typescript
import { Router } from 'express';
import { productController } from '../controllers/productController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
  listProductsSchema
} from '../utils/validators';
import { UserRole } from '@prisma/client';

const router = Router();

// Routes accessible to all users (public)
router.get('/', validate(listProductsSchema), productController.getAllProducts);
router.get('/:id', validate(getProductSchema), productController.getProduct);

// Routes requiring authentication and authorization (Admin only for full CRUD)
router.use(protect, authorize(UserRole.ADMIN)); // Protect and authorize subsequent routes

router.post('/', validate(createProductSchema), productController.createProduct);
router.patch('/:id', validate(updateProductSchema), productController.updateProduct);
router.delete('/:id', validate(getProductSchema), productController.deleteProduct);

export default router;
```