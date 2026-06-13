```typescript
import { Router } from 'express';
import { createDashboard, getDashboards, getDashboardById, updateDashboard, deleteDashboard } from '../controllers/dashboard.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { cachingMiddleware, dashboardCache } from '../middleware/cache.middleware';

const router = Router();

router.use(authenticateToken);

// Invalidate cache on mutations
router.post('/', (req, res, next) => {
  dashboardCache.clearAll();
  next();
}, createDashboard);
router.put('/:id', (req, res, next) => {
  dashboardCache.clearAll();
  next();
}, updateDashboard);
router.delete('/:id', (req, res, next) => {
  dashboardCache.clearAll();
  next();
}, deleteDashboard);

// Read operations use caching
router.get('/', cachingMiddleware(dashboardCache), getDashboards);
router.get('/:id', cachingMiddleware(dashboardCache), getDashboardById);

export default router;
```