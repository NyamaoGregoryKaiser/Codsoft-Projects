import { Router } from 'express';
import * as targetDatabaseController from '../controllers/targetDatabase.controller';
import authMiddleware from '../middlewares/auth.middleware';
import { UserRole } from '@prisma/client';
import validate from '../middlewares/validation.middleware';
import Joi from 'joi';

const router = Router();

const createTargetDatabaseSchema = Joi.object({
  name: Joi.string().required(),
  type: Joi.string().required(),
  connectionString: Joi.string().optional(),
  description: Joi.string().optional(),
});

const updateTargetDatabaseSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().optional(),
  connectionString: Joi.string().optional(),
  description: Joi.string().optional(),
});

router.route('/')
  .post(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(createTargetDatabaseSchema), targetDatabaseController.createTargetDatabase)
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), targetDatabaseController.getTargetDatabases);

router.route('/:id')
  .get(authMiddleware([UserRole.ADMIN, UserRole.USER]), targetDatabaseController.getTargetDatabase)
  .put(authMiddleware([UserRole.ADMIN, UserRole.USER]), validate(updateTargetDatabaseSchema), targetDatabaseController.updateTargetDatabase)
  .delete(authMiddleware([UserRole.ADMIN]), targetDatabaseController.deleteTargetDatabase); // Only admin can delete target databases

export default router;
```