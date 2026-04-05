const httpStatus = require('http-status');
const { ScrapedData, ScrapeJob, Target } = require('../db/models');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/**
 * Query for scraped data entries
 * @param {Object} filter
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const queryScrapedData = async (filter, options) => {
  const data = await ScrapedData.findAndCountAll({
    where: filter,
    limit: options.limit,
    offset: (options.page - 1) * options.limit,
    order: options.sortBy ? [options.sortBy.split(':')] : [['createdAt', 'DESC']],
    include: [
      { model: ScrapeJob, as: 'scrapeJob', attributes: ['status', 'triggeredBy', 'createdAt'] },
      { model: Target, as: 'target', attributes: ['name', 'url'] }
    ]
  });
  return data;
};

/**
 * Get scraped data by ID
 * @param {string} dataId
 * @returns {Promise<ScrapedData>}
 */
const getScrapedDataById = async (dataId) => {
  const data = await ScrapedData.findByPk(dataId, {
    include: [
      { model: ScrapeJob, as: 'scrapeJob', attributes: ['status', 'triggeredBy', 'createdAt'] },
      { model: Target, as: 'target', attributes: ['name', 'url'] }
    ]
  });
  if (!data) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Scraped data not found');
  }
  return data;
};

/**
 * Get scraped data by ScrapeJob ID
 * @param {string} jobId
 * @param {Object} options
 * @returns {Promise<QueryResult>}
 */
const getScrapedDataByJobId = async (jobId, options) => {
  const data = await ScrapedData.findAndCountAll({
    where: { scrapeJobId: jobId },
    limit: options.limit,
    offset: (options.page - 1) * options.limit,
    order: options.sortBy ? [options.sortBy.split(':')] : [['createdAt', 'DESC']],
    include: [
      { model: ScrapeJob, as: 'scrapeJob', attributes: ['status', 'triggeredBy', 'createdAt'] },
      { model: Target, as: 'target', attributes: ['name', 'url'] }
    ]
  });
  return data;
};


module.exports = {
  queryScrapedData,
  getScrapedDataById,
  getScrapedDataByJobId,
};