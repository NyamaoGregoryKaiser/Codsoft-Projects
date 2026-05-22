```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import projectRoutes from './project.routes';
import datasetRoutes from './dataset.routes';
import modelRoutes from './model.routes';
import experimentRoutes from './experiment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/projects', projectRoutes);
router.use('/datasets', datasetRoutes);
router.use('/models', modelRoutes);
router.use('/experiments', experimentRoutes);

export default router;
```