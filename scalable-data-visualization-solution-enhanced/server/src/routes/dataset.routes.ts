```typescript
import { Router } from 'express';
import { datasetController } from '../controllers/dataset.controller';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../models/User';
import multer from 'multer';
import { cacheMiddleware } from '../middleware/caching';

const router = Router();
const upload = multer(); // For handling file uploads (in-memory storage)

router.use(protect); // All dataset routes require authentication

router.post('/', upload.single('file'), datasetController.createDataset);
router.get('/', cacheMiddleware, datasetController.getDatasets);
router.get('/:id', cacheMiddleware, datasetController.getDatasetById);
router.get('/:id/data', cacheMiddleware, datasetController.getDatasetData);
router.put('/:id', datasetController.updateDataset);
router.delete('/:id', datasetController.deleteDataset);

// Admin-specific routes for datasets (optional, demonstrating RBAC)
router.delete('/admin/:id', authorize([UserRole.ADMIN]), datasetController.deleteDataset);

export default router;
```