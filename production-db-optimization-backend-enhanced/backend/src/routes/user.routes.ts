import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import validate from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();

const createUserSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.USER),
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional(),
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  role: Joi.string().valid(...Object.values(UserRole)).optional(),
});

// Admin-only routes for user management
router.route('/')
  .get(authMiddleware([UserRole.ADMIN]), userController.getUsers)
  .post(authMiddleware([UserRole.ADMIN]), validate(createUserSchema), userController.createUser);

router.route('/:id')
  .get(authMiddleware([UserRole.ADMIN]), userController.getUserById)
  .put(authMiddleware([UserRole.ADMIN]), validate(updateUserSchema), userController.updateUser)
  .delete(authMiddleware([UserRole.ADMIN]), userController.deleteUser);

export default router;
```