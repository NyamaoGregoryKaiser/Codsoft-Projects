```typescript
import { Router } from 'express';
import { createVisualization, getVisualizations, getVisualizationById, updateVisualization, deleteVisualization } from '../controllers/visualization.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { cachingMiddleware, visualizationCache } from '../middleware/cache.middleware';

const router = Router();

router.use(authenticateToken);

// Invalidate cache on mutations
router.post('/', (req, res, next) => {
  visualizationCache.clearAll();
  next();
}, createVisualization);
router.put('/:id', (req, res, next) => {
  visualizationCache.clearAll();
  next();
}, updateVisualization);
router.delete('/:id', (req, res, next) => {
  visualizationCache.clearAll();
  next();
}, deleteVisualization);

// Read operations use caching
router.get('/', cachingMiddleware(visualizationCache), getVisualizations);
router.get('/:id', cachingMiddleware(visualizationCache), getVisualizationById);

export default router;
```