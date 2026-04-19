```typescript
import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { protect } from '../middleware/auth';
import { authorize } from '../middleware/authorize';
import { UserRole } from '../models/User';
import { cacheMiddleware } from '../middleware/caching';

const router = Router();

router.use(protect); // All dashboard routes require authentication

router.post('/', dashboardController.createDashboard);
router.get('/', cacheMiddleware, dashboardController.getDashboards);
router.get('/:id', cacheMiddleware, dashboardController.getDashboardById);
router.put('/:id', dashboardController.updateDashboard);
router.delete('/:id', dashboardController.deleteDashboard);

// Admin-specific routes for dashboards (optional, demonstrating RBAC)
router.delete('/admin/:id', authorize([UserRole.ADMIN]), dashboardController.deleteDashboard);

export default router;
```