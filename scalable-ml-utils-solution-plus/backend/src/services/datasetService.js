```javascript
const db = require('../db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getOrSetCache } = require('../utils/cacheManager');

const CACHE_KEY_ALL_DATASETS = 'allDatasets';

const getAllDatasets = async () => {
  try {
    const datasets = await getOrSetCache(CACHE_KEY_ALL_DATASETS, async () => {
      const result = await db.Dataset.findAll({
        include: [
          { model: db.User, as: 'owner', attributes: ['id', 'username', 'email'] }
        ]
      });
      logger.debug('Fetched all datasets from DB (cache miss).');
      return result;
    });
    logger.debug('Fetched all datasets.');
    return datasets;
  } catch (error) {
    logger.error('Error fetching all datasets:', error);
    throw new AppError('Could not retrieve datasets.', 500);
  }
};

const getDatasetById = async (id) => {
  try {
    const dataset = await getOrSetCache(`dataset-${id}`, async () => {
      const result = await db.Dataset.findByPk(id, {
        include: [
          { model: db.User, as: 'owner', attributes: ['id', 'username', 'email'] }
        ]
      });
      if (!result) {
        throw new AppError('Dataset not found.', 404);
      }
      logger.debug(`Fetched dataset by ID ${id} from DB (cache miss).`);
      return result;
    });
    logger.debug(`Fetched dataset by ID: ${id}`);
    return dataset;
  } catch (error) {
    logger.error(`Error fetching dataset by ID ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not retrieve dataset.', 500);
  }
};

const createDataset = async (datasetData, ownerId) => {
  try {
    const newDataset = await db.Dataset.create({ ...datasetData, owner_id: ownerId });
    // Invalidate cache for all datasets
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_DATASETS);
    logger.info(`Dataset created: ${newDataset.name} (${newDataset.id}) by user ${ownerId}`);
    return newDataset;
  } catch (error) {
    logger.error('Error creating dataset:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Dataset with that name already exists.', 400);
    }
    if (error.name === 'SequelizeValidationError') {
      throw new AppError(error.errors.map(e => e.message).join(', '), 400);
    }
    throw new AppError('Could not create dataset.', 500);
  }
};

const updateDataset = async (id, datasetData) => {
  try {
    const dataset = await db.Dataset.findByPk(id);
    if (!dataset) {
      throw new AppError('Dataset not found.', 404);
    }
    await dataset.update(datasetData);
    // Invalidate cache for this specific dataset and all datasets
    db.sequelize.cacheManager.del(`dataset-${id}`);
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_DATASETS);
    logger.info(`Dataset updated: ${dataset.name} (${dataset.id})`);
    return dataset;
  } catch (error) {
    logger.error(`Error updating dataset ${id}:`, error);
    if (error.name === 'AppError') throw error;
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Dataset with that name already exists.', 400);
    }
    if (error.name === 'SequelizeValidationError') {
      throw new AppError(error.errors.map(e => e.message).join(', '), 400);
    }
    throw new AppError('Could not update dataset.', 500);
  }
};

const deleteDataset = async (id) => {
  try {
    const dataset = await db.Dataset.findByPk(id);
    if (!dataset) {
      throw new AppError('Dataset not found.', 404);
    }
    await dataset.destroy();
    // Invalidate cache for this specific dataset and all datasets
    db.sequelize.cacheManager.del(`dataset-${id}`);
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_DATASETS);
    logger.info(`Dataset deleted: ${id}`);
    return { message: 'Dataset deleted successfully.' };
  } catch (error) {
    logger.error(`Error deleting dataset ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not delete dataset.', 500);
  }
};

module.exports = {
  getAllDatasets,
  getDatasetById,
  createDataset,
  updateDataset,
  deleteDataset
};
```