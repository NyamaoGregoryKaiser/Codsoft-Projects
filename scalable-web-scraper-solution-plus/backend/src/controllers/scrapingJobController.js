```javascript
const asyncHandler = require('../middleware/errorMiddleware').asyncHandler;
const scrapingJobService = require('../services/scrapingJobService');
const logger = require('../utils/logger');

/**
 * @desc Create a new scraping job
 * @route POST /api/scraping-jobs
 * @access Private
 */
const createJob = asyncHandler(async (req, res) => {
  const { name, description, startUrl, cssSelectors, schedule, proxyEnabled, jsRendering } = req.body;

  // Basic validation
  if (!name || !startUrl || !cssSelectors || !Array.isArray(cssSelectors) || cssSelectors.length === 0) {
    res.status(400);
    throw new Error('Please include name, startUrl, and at least one cssSelector');
  }

  const job = await scrapingJobService.createScrapingJob({
    name,
    description,
    startUrl,
    cssSelectors,
    schedule,
    proxyEnabled,
    jsRendering,
  }, req.user.id); // Attach job to the authenticated user

  res.status(201).json(job);
});

/**
 * @desc Get all scraping jobs for the authenticated user
 * @route GET /api/scraping-jobs
 * @access Private
 */
const getJobs = asyncHandler(async (req, res) => {
  const jobs = await scrapingJobService.getScrapingJobs(req.user.id);
  res.status(200).json(jobs);
});

/**
 * @desc Get a single scraping job by ID
 * @route GET /api/scraping-jobs/:id
 * @access Private
 */
const getJobById = asyncHandler(async (req, res) => {
  const job = await scrapingJobService.getScrapingJobById(req.params.id, req.user.id);
  res.status(200).json(job);
});

/**
 * @desc Update a scraping job
 * @route PUT /api/scraping-jobs/:id
 * @access Private
 */
const updateJob = asyncHandler(async (req, res) => {
  const { name, description, startUrl, cssSelectors, schedule, proxyEnabled, jsRendering, status } = req.body;

  const updatedJob = await scrapingJobService.updateScrapingJob(req.params.id, {
    name,
    description,
    startUrl,
    cssSelectors,
    schedule,
    proxyEnabled,
    jsRendering,
    status // Allow updating status if needed, though usually managed by system
  }, req.user.id);

  res.status(200).json(updatedJob);
});

/**
 * @desc Delete a scraping job
 * @route DELETE /api/scraping-jobs/:id
 * @access Private
 */
const deleteJob = asyncHandler(async (req, res) => {
  await scrapingJobService.deleteScrapingJob(req.params.id, req.user.id);
  res.status(200).json({ message: 'Scraping job removed' });
});

/**
 * @desc Manually trigger a scraping job run
 * @route POST /api/scraping-jobs/:id/run
 * @access Private
 */
const runJob = asyncHandler(async (req, res) => {
  const result = await scrapingJobService.executeScrapingJob(req.params.id, req.user.id);
  res.status(200).json({ message: 'Scraping job initiated successfully', result });
});

/**
 * @desc Get results for a specific scraping job
 * @route GET /api/scraping-jobs/:id/results
 * @access Private
 */
const getJobResults = asyncHandler(async (req, res) => {
  const results = await scrapingJobService.getScrapingJobResults(req.params.id, req.user.id);
  res.status(200).json(results);
});

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  runJob,
  getJobResults,
};
```