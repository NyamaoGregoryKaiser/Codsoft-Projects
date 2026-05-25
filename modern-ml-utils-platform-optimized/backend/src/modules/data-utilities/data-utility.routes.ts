import { Router } from 'express';
import * as dataUtilityController from './data-utility.controller';
import { protect } from '../../middleware/auth';

const router = Router();

// These endpoints typically receive data in the request body
// and return transformed data. They are not cached as they are dynamic.
router.post('/encode/one-hot', protect, dataUtilityController.oneHotEncode);
router.post('/scale/min-max', protect, dataUtilityController.minMaxScale);

export default router;