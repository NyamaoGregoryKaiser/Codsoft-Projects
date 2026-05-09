import { Router } from 'express';
import * as userController from './user.controller';
import validate from '../../middleware/validation.middleware';
import { createUserSchema, deleteUserSchema, getUserSchema, updateUserSchema } from './user.validation';
import { authorize, protect } from '../../middleware/auth.middleware';
import { UserRole } from '../../types';
import cache from '../../middleware/cache.middleware';

const router = Router();

router.route('/')
  .post(protect, authorize([UserRole.ADMIN]), validate(createUserSchema), userController.createUser)
  .get(protect, authorize([UserRole.ADMIN]), cache({key: 'all_users', ttl: 60}), userController.getAllUsers);

router.route('/:userId')
  .get(protect, authorize([UserRole.ADMIN, UserRole.USER]), validate(getUserSchema), userController.getUserById)
  .patch(protect, authorize([UserRole.ADMIN]), validate(updateUserSchema), userController.updateUserById) // User can only update their own profile (not implemented here fully)
  .delete(protect, authorize([UserRole.ADMIN]), validate(deleteUserSchema), userController.deleteUserById);

export default router;