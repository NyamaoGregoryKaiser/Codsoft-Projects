```typescript
import express from 'express';
import * as commentController from './comment.controller';
import { protect } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import { CreateCommentDto, UpdateCommentDto, TaskIdParamDto, CommentIdParamDto, CommentListQueryDto } from './comment.dto';
import { cache, invalidateCache } from '../../middleware/cache.middleware';

const router = express.Router({ mergeParams: true }); // Merge params from parent router (e.g., taskId from task routes)

router.use(protect); // All comment routes require authentication

router
  .route('/')
  .post(validateParams(TaskIdParamDto), validateBody(CreateCommentDto), invalidateCache(['comments', 'task']), commentController.createComment)
  .get(validateParams(TaskIdParamDto), validateQuery(CommentListQueryDto), cache({ expiration: 60 }), commentController.getCommentsByTask);

router
  .route('/:commentId')
  .get(validateParams(CommentIdParamDto), cache({ expiration: 300 }), commentController.getCommentById)
  .patch(validateParams(CommentIdParamDto), validateBody(UpdateCommentDto), invalidateCache(['comments', 'task', 'comment']), commentController.updateComment)
  .delete(validateParams(CommentIdParamDto), invalidateCache(['comments', 'task', 'comment']), commentController.deleteComment);

export default router;
```