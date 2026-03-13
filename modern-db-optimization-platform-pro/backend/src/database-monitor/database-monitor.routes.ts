```typescript
import { Router } from 'express';
import { databaseMonitorController, validateConnectionIdParam, validateAnalyzeQuery, validateCreateIndex, validateDropIndex, validateGetTableSchema } from './database-monitor.controller';
import { protect } from '../shared/auth-middleware';

const router = Router();

router.use(protect); // All routes in this module require authentication

// Metrics & Monitoring
router.get('/:connectionId/active-queries', validateConnectionIdParam, databaseMonitorController.getActiveQueries);
router.get('/:connectionId/slow-queries', validateConnectionIdParam, databaseMonitorController.getSlowQueries);

// Query Analysis
router.post('/:connectionId/analyze-query', validateAnalyzeQuery, databaseMonitorController.analyzeQuery);

// Index Management
router.get('/:connectionId/indexes', validateConnectionIdParam, databaseMonitorController.getIndexes);
router.post('/:connectionId/indexes', validateCreateIndex, databaseMonitorController.createIndex);
router.delete('/:connectionId/indexes', validateDropIndex, databaseMonitorController.dropIndex); // Using DELETE with body for indexName

// Schema Browsing
router.get('/:connectionId/schema', validateGetTableSchema, databaseMonitorController.getTableSchema);


export default router;
```