import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../models/User.entity';

const router = Router();
const taskController = new TaskController();

router.post('/', authMiddleware([UserRole.USER, UserRole.ADMIN]), taskController.createTask);
router.get('/project/:projectId', authMiddleware([UserRole.USER, UserRole.ADMIN]), taskController.getTasksByProjectId); // No cache here as project detail already caches it
router.get('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), taskController.getTaskById);
router.put('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), taskController.updateTask);
router.delete('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), taskController.deleteTask);

export default router;