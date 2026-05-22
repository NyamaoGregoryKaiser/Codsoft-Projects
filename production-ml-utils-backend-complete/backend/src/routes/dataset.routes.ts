```typescript
import { Router } from 'express';
import { protect } from '../auth/auth.middleware';
import { createDataset, deleteDataset, downloadDataset, getAllDatasets, getDataset } from '../modules/datasets/dataset.controller';

const router = Router();

router.use(protect);

router.route('/')
  .post(createDataset)
  .get(getAllDatasets);

router.route('/:id')
  .get(getDataset)
  .delete(deleteDataset);

router.get('/:id/download', downloadDataset);

export default router;
```