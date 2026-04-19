```typescript
import { Router } from 'express';
import { visualizationController } from '../controllers/visualization.controller';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../models/User';
import { cacheMiddleware } from '../middleware/caching';

const router = Router();

router.use(protect); // All visualization routes require authentication

router.post('/', visualizationController.createVisualization);
router.get('/', cacheMiddleware, visualizationController.getVisualizations);
router.get('/:id', cacheMiddleware, visualizationController.getVisualizationById);
router.get('/:id/data', cacheMiddleware, visualizationController.getVisualizationData);
router.put('/:id', visualizationController.updateVisualization);
router.delete('/:id', visualizationController.deleteVisualization);

// Admin-specific routes for visualizations (optional, demonstrating RBAC)
router.delete('/admin/:id', authorize([UserRole.ADMIN]), visualizationController.deleteVisualization);

export default router;
```