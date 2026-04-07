```typescript
import { Router } from 'express';
import JobService from '../../services/jobService'; // ResultService methods are in JobService for simplicity
import { protect } from '../../middleware/auth';
import ApiResponse from '../../lib/ApiResponse';

const router = Router();

// Get a single scraping result by ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const result = await JobService.getResultById(req.params.id, req.user!.id, req.user!.role);
    res.status(200).json(ApiResponse.success(result));
  } catch (error) {
    next(error);
  }
});

export default router;
```