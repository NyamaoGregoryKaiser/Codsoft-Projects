```typescript
import { Router } from 'express';
import { protect, restrictTo } from '../auth/auth.middleware';
import { createProject, deleteProject, getAllProjects, getProject, updateProject } from '../modules/projects/project.controller';

const router = Router();

router.use(protect); // All project routes require authentication

router.route('/')
  .get(getAllProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .patch(updateProject)
  .delete(deleteProject);

export default router;
```
*(Similar route files would exist for `dataset.routes.ts`, `model.routes.ts`, `experiment.routes.ts`)*