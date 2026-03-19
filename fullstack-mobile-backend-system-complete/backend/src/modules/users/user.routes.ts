import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize } from '../../middleware/authMiddleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Routes for administrators
router.get('/', authenticate, authorize([UserRole.ADMIN]), userController.getAllUsers);
router.delete('/:id', authenticate, authorize([UserRole.ADMIN]), userController.deleteUser);

// Routes for authenticated users (can be admin or regular user)
router.get('/:id', authenticate, userController.getUserProfile); // A user can view their own profile, admin can view any
router.patch('/:id', authenticate, userController.updateProfile); // A user can update their own profile, admin can update any

export default router;