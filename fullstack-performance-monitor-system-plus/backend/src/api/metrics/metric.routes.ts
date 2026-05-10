import { Router } from 'express';
import * as metricController from './metric.controller';
import { validateApiKey, protect, authorizeProjectAccess } from '../../middleware/auth';
import { apiRateLimiter } from '../../middleware/rateLimiter';

const router = Router();

// Route for monitored applications to submit metrics (API key protected, rate limited)
router.post('/ingest', apiRateLimiter, validateApiKey, metricController.ingestMetrics);

// Routes for AppInsight users to view metrics (JWT protected, project owner authorized)
router.use(protect); // Protect subsequent routes
router.use('/:projectId', authorizeProjectAccess); // Authorize access to specific project

router.get('/:projectId/summary', metricController.getProjectSummaryMetrics);
router.get('/:projectId/timeline', metricController.getMetricsTimeline);
router.get('/:projectId/errors', metricController.getRecentErrors);

export { router as metricRouter };