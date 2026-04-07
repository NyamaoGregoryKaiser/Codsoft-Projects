```javascript
const db = require('../db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { Op } = require('sequelize');
const { getOrSetCache } = require('../utils/cacheManager');

const getInferenceLogs = async (modelId, page = 1, limit = 10, startDate, endDate, status) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (modelId) {
    whereClause.model_id = modelId;
  }
  if (startDate) {
    whereClause.timestamp = { [Op.gte]: new Date(startDate) };
  }
  if (endDate) {
    whereClause.timestamp = { ...whereClause.timestamp, [Op.lte]: new Date(endDate) };
  }
  if (status) {
    whereClause.status = status;
  }

  const cacheKey = `inferenceLogs-${modelId}-${page}-${limit}-${startDate}-${endDate}-${status}`;

  try {
    const { count, rows } = await getOrSetCache(cacheKey, async () => {
      const result = await db.InferenceLog.findAndCountAll({
        where: whereClause,
        limit,
        offset,
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: db.Model,
            as: 'model',
            attributes: ['id', 'name', 'version'],
            include: [{ model: db.User, as: 'owner', attributes: ['id', 'username'] }]
          }
        ]
      });
      logger.debug(`Fetched inference logs from DB for model ${modelId} (cache miss).`);
      return result;
    });
    logger.debug(`Fetched inference logs for model ${modelId}`);
    return {
      total: count,
      page,
      limit,
      data: rows
    };
  } catch (error) {
    logger.error(`Error fetching inference logs for model ${modelId}:`, error);
    throw new AppError('Could not retrieve inference logs.', 500);
  }
};

const getInferenceLogById = async (id) => {
  try {
    const log = await getOrSetCache(`inferenceLog-${id}`, async () => {
      const result = await db.InferenceLog.findByPk(id, {
        include: [
          {
            model: db.Model,
            as: 'model',
            attributes: ['id', 'name', 'version'],
            include: [{ model: db.User, as: 'owner', attributes: ['id', 'username'] }]
          }
        ]
      });
      if (!result) {
        throw new AppError('Inference log not found.', 404);
      }
      logger.debug(`Fetched inference log by ID ${id} from DB (cache miss).`);
      return result;
    });
    logger.debug(`Fetched inference log by ID: ${id}`);
    return log;
  } catch (error) {
    logger.error(`Error fetching inference log by ID ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not retrieve inference log.', 500);
  }
};

module.exports = {
  getInferenceLogs,
  getInferenceLogById
};
```