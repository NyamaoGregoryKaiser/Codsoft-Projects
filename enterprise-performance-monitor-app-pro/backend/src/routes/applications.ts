import { Router } from 'express';
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
  refreshApplicationApiKey
} from '../controllers/application';
import { authenticate, authorizeApplicationOwner } from '../middleware/auth';
import { createApplicationValidation, validate } from '../utils/validation';

const router = Router();

router.route('/')
  .post(authenticate, createApplicationValidation, validate, createApplication)
  .get(authenticate, getApplications);

router.route('/:applicationId')
  .get(authenticate, authorizeApplicationOwner, getApplicationById)
  .put(authenticate, authorizeApplicationOwner, createApplicationValidation, validate, updateApplication) // Reusing validation
  .delete(authenticate, authorizeApplicationOwner, deleteApplication);

router.post('/:applicationId/refresh-api-key', authenticate, authorizeApplicationOwner, refreshApplicationApiKey);

export default router;