```javascript
const { ScrapingResult, ScrapingJob } = require('../models');
const logger = require('../utils/logger');

/**
 * Gets all scraping results for a user's jobs.
 * This can be filtered by jobId if provided.
 * @param {string} userId - ID of the user.
 * @param {string} [jobId] - Optional job ID to filter results.
 * @returns {Promise<Array<Object>>} List of scraping results.
 */
const getScrapingResults = async (userId, jobId = null) => {
  // First, find all job IDs belonging to the user
  const userJobs = await ScrapingJob.findAll({
    where: { userId },
    attributes: ['id']
  });
  const userJobIds = userJobs.map(job => job.id);

  if (!userJobIds.length) {
    return []; // No jobs for this user, so no results
  }

  const whereClause = {
    jobId: userJobIds, // Ensure results belong to user's jobs
  };

  if (jobId) {
    // If a specific jobId is requested, make sure it's one of the user's jobs
    if (!userJobIds.includes(jobId)) {
      throw new Error('Scraping job not found or unauthorized for this user.');
    }
    whereClause.jobId = jobId;
  }

  const results = await ScrapingResult.findAll({
    where: whereClause,
    order: [['scrapedAt', 'DESC']],
    include: [{
      model: ScrapingJob,
      as: 'job',
      attributes: ['name', 'startUrl'] // Include some job details
    }]
  });
  return results;
};

/**
 * Gets a single scraping result by ID.
 * @param {string} resultId - ID of the result.
 * @param {string} userId - ID of the user (for authorization).
 * @returns {Promise<Object>} The scraping result.
 * @throws {Error} If result not found or user not authorized.
 */
const getScrapingResultById = async (resultId, userId) => {
  const result = await ScrapingResult.findByPk(resultId, {
    include: [{
      model: ScrapingJob,
      as: 'job',
      attributes: ['id', 'name', 'startUrl', 'userId']
    }]
  });

  if (!result) {
    throw new Error('Scraping result not found.');
  }

  // Authorize: ensure the result belongs to one of the user's jobs
  if (result.job.userId !== userId) {
    throw new Error('Not authorized to view this scraping result.');
  }

  return result;
};

module.exports = {
  getScrapingResults,
  getScrapingResultById,
};
```