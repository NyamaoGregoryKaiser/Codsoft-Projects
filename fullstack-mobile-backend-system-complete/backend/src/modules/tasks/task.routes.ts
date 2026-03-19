import { Router } from 'express';
import * as taskController from './task.controller';
import { authenticate } from '../../middleware/authMiddleware';

const router = Router();

// All task routes require authentication
router.use(authenticate);

router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.patch('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

export default router;