import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../models/User.entity';
import { cacheMiddleware } from '../middleware/cache.middleware';

const router = Router();
const projectController = new ProjectController();

router.post('/', authMiddleware([UserRole.USER, UserRole.ADMIN]), projectController.createProject);
router.get('/', authMiddleware([UserRole.USER, UserRole.ADMIN]), cacheMiddleware(300), projectController.getAllProjects); // Cache for 5 minutes
router.get('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), cacheMiddleware(300), projectController.getProjectById); // Cache for 5 minutes
router.put('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), projectController.updateProject);
router.delete('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), projectController.deleteProject);

export default router;