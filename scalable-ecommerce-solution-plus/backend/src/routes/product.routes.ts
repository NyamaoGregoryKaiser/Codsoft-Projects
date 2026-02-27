import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types';

const router = Router();

// Public routes
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);

// Admin-only routes
router.post('/', authenticate, authorize([UserRole.ADMIN]), productController.createProduct);
router.put('/:id', authenticate, authorize([UserRole.ADMIN]), productController.updateProduct);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), productController.deleteProduct);

export default router;