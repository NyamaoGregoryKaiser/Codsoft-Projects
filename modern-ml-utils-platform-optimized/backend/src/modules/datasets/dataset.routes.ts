import { Router } from 'express';
import * as datasetController from './dataset.controller';
import { protect } from '../../middleware/auth';
import { cache, clearCache } from '../../middleware/cache'; // Import clearCache

const router = Router();

router.route('/')
  .post(protect, datasetController.createDataset)
  .get(protect, cache(), datasetController.getDatasets); // Cache list of datasets

router.route('/:datasetId')
  .get(protect, cache(), datasetController.getDataset) // Cache individual dataset
  .patch(protect, datasetController.updateDataset)
  .delete(protect, datasetController.deleteDataset);

export default router;