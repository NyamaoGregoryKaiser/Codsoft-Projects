```javascript
const asyncHandler = require('../middleware/errorMiddleware').asyncHandler;
const scrapingResultService = require('../services/scrapingResultService');
const logger = require('../utils/logger');

/**
 * @desc Get all scraping results for the authenticated user's jobs
 * @route GET /api/scraping-results
 * @access Private
 * @queryParam {string} jobId - Optional filter to get results for a specific job.
 */
const getResults = asyncHandler(async (req, res) => {
  const { jobId } = req.query;
  const results = await scrapingResultService.getScrapingResults(req.user.id, jobId);
  res.status(200).json(results);
});

/**
 * @desc Get a single scraping result by ID
 * @route GET /api/scraping-results/:id
 * @access Private
 */
const getResultById = asyncHandler(async (req, res) => {
  const result = await scrapingResultService.getScrapingResultById(req.params.id, req.user.id);
  res.status(200).json(result);
});

module.exports = {
  getResults,
  getResultById,
};
```