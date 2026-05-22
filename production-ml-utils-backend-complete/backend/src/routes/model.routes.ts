```typescript
import { Router } from 'express';
import { protect } from '../auth/auth.middleware';
import { createModel, deleteModel, downloadModel, getAllModels, getModel, runInference } from '../modules/models/model.controller';

const router = Router();

router.use(protect);

router.route('/')
  .post(createModel)
  .get(getAllModels);

router.route('/:id')
  .get(getModel)
  .delete(deleteModel);

router.get('/:id/download', downloadModel);
router.post('/:id/inference', runInference); // Inference endpoint

export default router;
```