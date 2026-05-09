import { Router } from 'express';
import * as orderController from './order.controller';
import validate from '../../middleware/validation.middleware';
import { createOrderSchema, deleteOrderSchema, getOrderSchema, updateOrderSchema } from './order.validation';
import { authorize, protect } from '../../middleware/auth.middleware';
import { UserRole } from '../../types';

const router = Router();

router.route('/')
  .post(protect, authorize([UserRole.ADMIN, UserRole.USER]), validate(createOrderSchema), orderController.createOrder)
  .get(protect, authorize([UserRole.ADMIN, UserRole.USER]), orderController.getAllOrders);

router.route('/:orderId')
  .get(protect, authorize([UserRole.ADMIN, UserRole.USER]), validate(getOrderSchema), orderController.getOrderById)
  .patch(protect, authorize([UserRole.ADMIN]), validate(updateOrderSchema), orderController.updateOrderById)
  .delete(protect, authorize([UserRole.ADMIN]), validate(deleteOrderSchema), orderController.deleteOrderById);

export default router;