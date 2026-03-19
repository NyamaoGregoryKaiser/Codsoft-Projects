import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '../database/entities/User.entity';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();

// Public routes with caching
router.get('/', cacheMiddleware('products', 60), productController.getProducts);
router.get('/:id', cacheMiddleware('product-detail', 60), productController.getProductById);

// Admin-only routes
router.post('/', authenticate, authorize([UserRole.ADMIN]), productController.createProduct);
router.put('/:id', authenticate, authorize([UserRole.ADMIN]), productController.updateProduct);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), productController.deleteProduct);

export default router;