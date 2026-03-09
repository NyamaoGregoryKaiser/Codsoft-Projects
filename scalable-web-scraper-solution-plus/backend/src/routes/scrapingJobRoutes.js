```javascript
const express = require('express');
const router = express.Router();
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  runJob,
  getJobResults
} = require('../controllers/scrapingJobController');

// All routes here are protected by the `protect` middleware set in app.js

router.route('/')
  .post(createJob)
  .get(getJobs);

router.route('/:id')
  .get(getJobById)
  .put(updateJob)
  .delete(deleteJob);

router.post('/:id/run', runJob);
router.get('/:id/results', getJobResults);

module.exports = router;
```