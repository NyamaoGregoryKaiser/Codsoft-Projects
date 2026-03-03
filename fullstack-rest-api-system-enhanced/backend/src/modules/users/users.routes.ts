import { Router } from 'express';
import { usersController } from './users.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../database/entities/User';

const router = Router();

// All user routes require authentication
router.use(protect);

// Admin-only routes
router.get('/', authorize([UserRole.ADMIN]), usersController.findAll.bind(usersController));
router.delete('/:id', authorize([UserRole.ADMIN]), usersController.remove.bind(usersController));

// User-specific or Admin routes
router.get('/:id', usersController.findOne.bind(usersController)); // User can view their own, Admin can view any
router.put('/:id', usersController.update.bind(usersController)); // User can update their own, Admin can update any

export default router;