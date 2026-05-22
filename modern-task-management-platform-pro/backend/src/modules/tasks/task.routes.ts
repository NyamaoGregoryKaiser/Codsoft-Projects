```typescript
import express from 'express';
import * as taskController from './task.controller';
import { protect } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import { CreateTaskDto, UpdateTaskDto, ProjectIdParamDto, TaskIdParamDto, TaskListQueryDto } from './task.dto';
import { cache, invalidateCache } from '../../middleware/cache.middleware';

const router = express.Router({ mergeParams: true }); // Merge params from parent router (e.g., projectId from project routes)

router.use(protect); // All task routes require authentication

router
  .route('/')
  .post(validateParams(ProjectIdParamDto), validateBody(CreateTaskDto), invalidateCache(['tasks', 'project']), taskController.createTask)
  .get(validateParams(ProjectIdParamDto), validateQuery(TaskListQueryDto), cache({ expiration: 60 }), taskController.getTasksByProject);

router
  .route('/:taskId')
  .get(validateParams(TaskIdParamDto), cache({ expiration: 300 }), taskController.getTaskById)
  .patch(validateParams(TaskIdParamDto), validateBody(UpdateTaskDto), invalidateCache(['tasks', 'project', 'task']), taskController.updateTask)
  .delete(validateParams(TaskIdParamDto), invalidateCache(['tasks', 'project', 'task']), taskController.deleteTask);

export default router;
```