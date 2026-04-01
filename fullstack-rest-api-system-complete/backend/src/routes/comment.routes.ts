import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../models/User.entity';

const router = Router();
const commentController = new CommentController();

router.post('/', authMiddleware([UserRole.USER, UserRole.ADMIN]), commentController.createComment);
router.get('/task/:taskId', authMiddleware([UserRole.USER, UserRole.ADMIN]), commentController.getCommentsByTaskId); // No cache here as task detail already caches it
router.put('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), commentController.updateComment);
router.delete('/:id', authMiddleware([UserRole.USER, UserRole.ADMIN]), commentController.deleteComment);

export default router;