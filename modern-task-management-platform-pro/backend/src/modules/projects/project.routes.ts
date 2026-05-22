```typescript
import express from 'express';
import * as projectController from './project.controller';
import { protect } from '../../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '../../middleware/validation.middleware';
import { CreateProjectDto, UpdateProjectDto, ProjectIdParamDto, ProjectListQueryDto } from './project.dto';
import { cache, invalidateCache } from '../../middleware/cache.middleware';

const router = express.Router();

router.use(protect); // All project routes require authentication

router
  .route('/')
  .post(validateBody(CreateProjectDto), invalidateCache(['projects']), projectController.createProject)
  .get(validateQuery(ProjectListQueryDto), cache({ expiration: 60 }), projectController.getAllProjects);

router
  .route('/:id')
  .get(validateParams(ProjectIdParamDto), cache({ expiration: 300 }), projectController.getProjectById)
  .patch(validateParams(ProjectIdParamDto), validateBody(UpdateProjectDto), invalidateCache(['projects', 'project']), projectController.updateProject)
  .delete(validateParams(ProjectIdParamDto), invalidateCache(['projects', 'project']), projectController.deleteProject);

export default router;
```