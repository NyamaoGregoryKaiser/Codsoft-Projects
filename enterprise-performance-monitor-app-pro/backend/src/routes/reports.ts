import { Router } from 'express';
import { getApplicationOverview, getPageMetrics, getMetricTrends } from '../controllers/report';
import { authenticate, authorizeApplicationOwner } from '../middleware/auth';
import { cacheMiddleware } from '../middleware/cache';

const router = Router();

// Apply caching to reporting endpoints as data might not change very frequently
router.use(cacheMiddleware);

router.get('/:applicationId/overview', authenticate, authorizeApplicationOwner, getApplicationOverview);
router.get('/:applicationId/pages/:pageId/metrics', authenticate, authorizeApplicationOwner, getPageMetrics);
router.get('/:applicationId/trends/:metricType', authenticate, authorizeApplicationOwner, getMetricTrends);
// Add more reporting endpoints as needed (e.g., breakdown by browser, device, country)

export default router;