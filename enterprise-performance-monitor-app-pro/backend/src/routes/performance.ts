import { Router } from 'express';
import { ingestPerformanceMetrics } from '../controllers/performance';
import { authenticateApiKey } from '../middleware/auth';
import { performanceDataRateLimiter } from '../middleware/rateLimit';
import { performanceMetricValidation, validate } from '../utils/validation';
import { performanceDataLogger } from '../middleware/logger';

const router = Router();

// This endpoint is for client-side applications to send performance data
router.post(
  '/metrics',
  performanceDataRateLimiter, // Rate limit for data ingestion
  authenticateApiKey,         // Authenticate using API key
  performanceMetricValidation, // Validate incoming data structure
  validate,                   // Apply validation
  performanceDataLogger,      // Log successful ingestion
  ingestPerformanceMetrics
);

export default router;