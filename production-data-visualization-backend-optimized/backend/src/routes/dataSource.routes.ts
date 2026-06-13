```typescript
import { Router } from 'express';
import multer from 'multer';
import { uploadDataSource, getDataSources, getDataSourceById, getDataSourceData, deleteDataSource } from '../controllers/dataSource.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { cachingMiddleware, dataSourceCache } from '../middleware/cache.middleware';
import path from 'path';
import { dbConfig } from '../config/db.config';

const router = Router();

const upload = multer({
  dest: dbConfig.dataStorageDir, // Files will be stored in the data directory
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed!'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(authenticateToken);

// Invalidate cache on mutations
router.post('/upload', upload.single('file'), (req, res, next) => {
  dataSourceCache.clearAll();
  next();
}, uploadDataSource);
router.delete('/:id', (req, res, next) => {
  dataSourceCache.clearAll();
  next();
}, deleteDataSource);


// Read operations use caching
router.get('/', cachingMiddleware(dataSourceCache), getDataSources);
router.get('/:id', cachingMiddleware(dataSourceCache), getDataSourceById);
router.get('/:id/data', cachingMiddleware(dataSourceCache), getDataSourceData);

export default router;
```