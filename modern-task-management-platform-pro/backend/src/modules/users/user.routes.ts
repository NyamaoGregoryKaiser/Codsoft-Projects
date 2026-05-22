```typescript
import express from 'express';
import * as userController from './user.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import { UserIdParamDto, UpdateUserDto, UpdateUserRoleDto, UserListQueryDto } from './user.dto';
import { UserRole } from '../../database/entities/user.entity';
import { cache, invalidateCache } from '../../middleware/cache.middleware';

const router = express.Router();

// Apply protection to all user routes
router.use(protect);

// Routes for current authenticated user
router
  .route('/me')
  .patch(validateBody(UpdateUserDto), invalidateCache(['users', 'auth:me']), userController.updateMe); // Update own profile

// Admin-only routes
router.use(authorize(UserRole.ADMIN));

router
  .route('/')
  .get(validateQuery(UserListQueryDto), cache({ expiration: 60 }), userController.getAllUsers); // Get all users

router
  .route('/:id')
  .get(validateParams(UserIdParamDto), cache({ expiration: 300 }), userController.getUserById) // Get user by ID
  .patch(validateParams(UserIdParamDto), validateBody(UpdateUserDto), invalidateCache('users'), userController.updateUser) // Update any user
  .delete(validateParams(UserIdParamDto), invalidateCache('users'), userController.deleteUser); // Delete user

router
  .route('/:id/role')
  .patch(validateParams(UserIdParamDto), validateBody(UpdateUserRoleDto), invalidateCache('users'), userController.updateUserRole); // Update user role

export default router;
```