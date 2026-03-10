import express from 'express';
import { createProduct, getProducts, getProduct, updateProduct, deleteProduct } from '@controllers/product.controller';
import { auth, authorize } from '@middleware/auth.middleware';
import { validate } from '@middleware/validation.middleware';
import { createProductSchema, getProductSchema, updateProductSchema } from '@validation/product.validation';
import { UserRoles } from '@constants/roles';
import { apiRateLimiter } from '@middleware/rateLimit.middleware';

export const productRoutes = express.Router();

productRoutes.use(apiRateLimiter); // Apply rate limiting to all product routes
productRoutes.use(auth()); // All product routes require authentication

productRoutes.route('/')
  .post(authorize([UserRoles.ADMIN]), validate({ body: createProductSchema }), createProduct) // Only admins can create products
  .get(getProducts); // All authenticated users can view products

productRoutes.route('/:productId')
  .get(validate({ params: getProductSchema }), getProduct)
  .patch(authorize([UserRoles.ADMIN]), validate({ params: getProductSchema, body: updateProductSchema }), updateProduct) // Only admins can update products
  .delete(authorize([UserRoles.ADMIN]), validate({ params: getProductSchema }), deleteProduct); // Only admins can delete products