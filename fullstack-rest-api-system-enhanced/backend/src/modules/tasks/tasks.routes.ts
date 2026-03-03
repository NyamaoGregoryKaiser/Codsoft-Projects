import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { protect, authorize } from '../../middleware/auth.middleware';
import { UserRole } from '../../database/entities/User';

const router = Router();

// All task routes require authentication
router.use(protect);

// Admin-only: create tasks, assign to any user
router.post('/', tasksController.create.bind(tasksController)); // Only admins can specify assigneeId other than themselves
router.get('/', tasksController.findAll.bind(tasksController));
router.get('/:id', tasksController.findOne.bind(tasksController));
router.put('/:id', tasksController.update.bind(tasksController));
router.delete('/:id', authorize([UserRole.ADMIN, UserRole.USER]), tasksController.remove.bind(tasksController)); // Both admin and task owner can delete

export default router;