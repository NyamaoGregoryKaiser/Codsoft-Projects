import { Router } from 'express';
import * as productController from './product.controller';
import validate from '../../middleware/validation.middleware';
import { createProductSchema, deleteProductSchema, getProductSchema, updateProductSchema } from './product.validation';
import { authorize, protect } from '../../middleware/auth.middleware';
import { UserRole } from '../../types';
import cache from '../../middleware/cache.middleware';

const router = Router();

router.route('/')
  .post(protect, authorize([UserRole.ADMIN]), validate(createProductSchema), productController.createProduct)
  .get(cache({ key: 'all_products', ttl: 300 }), productController.getAllProducts); // Cache products for 5 minutes

router.route('/:productId')
  .get(cache({ key: (req) => `product_${req.params.productId}`, ttl: 300 }), validate(getProductSchema), productController.getProductById)
  .patch(protect, authorize([UserRole.ADMIN]), validate(updateProductSchema), productController.updateProductById)
  .delete(protect, authorize([UserRole.ADMIN]), validate(deleteProductSchema), productController.deleteProductById);

export default router;