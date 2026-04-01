import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../models/User.entity';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();
const userController = new UserController();

// Admin-only routes
router.get('/', authMiddleware([UserRole.ADMIN]), cacheMiddleware(600), userController.getAllUsers); // Cache for 10 minutes
router.get('/:id', authMiddleware([UserRole.ADMIN]), userController.getUserById);
router.put('/:id', authMiddleware([UserRole.ADMIN]), userController.updateUser);
router.delete('/:id', authMiddleware([UserRole.ADMIN]), userController.deleteUser);

// User self-management route
router.put('/me', authMiddleware([UserRole.USER, UserRole.ADMIN]), userController.updateProfile);


export default router;