```typescript
import { Router } from 'express';
import JobService from '../../services/jobService';
import { protect, authorize } from '../../middleware/auth';
import { UserRole } from '@prisma/client';
import { validate } from '../middlewares/validate';
import { createJobSchema, updateJobSchema, paginationSchema } from '../../lib/validationSchemas';
import ApiResponse from '../../lib/ApiResponse';

const router = Router();

// Create a new scraping job
router.post('/', protect, authorize(UserRole.USER, UserRole.ADMIN), validate(createJobSchema), async (req, res, next) => {
  try {
    const job = await JobService.createJob({ ...req.body, userId: req.user!.id });
    res.status(201).json(ApiResponse.success(job, 'Scraping job created successfully', 201));
  } catch (error) {
    next(error);
  }
});

// Get all scraping jobs for the user (or all if admin)
router.get('/', protect, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { limit, offset } = req.query as { limit: number, offset: number };
    const jobs = await JobService.getJobs(req.user!.id, req.user!.role, limit, offset);
    res.status(200).json(ApiResponse.success(jobs));
  } catch (error) {
    next(error);
  }
});

// Get a single scraping job by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const job = await JobService.getJobById(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(ApiResponse.success(job));
  } catch (error) {
    next(error);
  }
});

// Update a scraping job
router.put('/:id', protect, authorize(UserRole.USER, UserRole.ADMIN), validate(updateJobSchema), async (req, res, next) => {
  try {
    const updatedJob = await JobService.updateJob(req.params.id, req.user!.id, req.user!.role, req.body);
    res.status(200).json(ApiResponse.success(updatedJob, 'Scraping job updated successfully'));
  } catch (error) {
    next(error);
  }
});

// Delete a scraping job
router.delete('/:id', protect, authorize(UserRole.USER, UserRole.ADMIN), async (req, res, next) => {
  try {
    await JobService.deleteJob(req.params.id, req.user!.id, req.user!.role);
    res.status(204).json(ApiResponse.success(null, 'Scraping job deleted successfully', 204));
  } catch (error) {
    next(error);
  }
});

// Manually trigger a scraping job
router.post('/:id/run', protect, authorize(UserRole.USER, UserRole.ADMIN), async (req, res, next) => {
  try {
    const message = await JobService.triggerJob(req.params.id, req.user!.id, req.user!.role);
    res.status(202).json(ApiResponse.success(null, message, 202));
  } catch (error) {
    next(error);
  }
});

// Get results for a specific job
router.get('/:id/results', protect, validate(paginationSchema, 'query'), async (req, res, next) => {
  try {
    const { limit, offset } = req.query as { limit: number, offset: number };
    const results = await JobService.getJobResults(req.params.id, req.user!.id, req.user!.role, limit, offset);
    res.status(200).json(ApiResponse.success(results));
  } catch (error) {
    next(error);
  }
});

export default router;
```