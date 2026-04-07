```javascript
const db = require('../db');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');
const { getOrSetCache } = require('../utils/cacheManager');

const CACHE_KEY_ALL_MODELS = 'allModels';

const getAllModels = async () => {
  try {
    const models = await getOrSetCache(CACHE_KEY_ALL_MODELS, async () => {
      const result = await db.Model.findAll({
        include: [
          { model: db.User, as: 'owner', attributes: ['id', 'username', 'email'] },
          { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description'] }
        ]
      });
      logger.debug('Fetched all models from DB (cache miss).');
      return result;
    });
    logger.debug('Fetched all models.');
    return models;
  } catch (error) {
    logger.error('Error fetching all models:', error);
    throw new AppError('Could not retrieve models.', 500);
  }
};

const getModelById = async (id) => {
  try {
    const model = await getOrSetCache(`model-${id}`, async () => {
      const result = await db.Model.findByPk(id, {
        include: [
          { model: db.User, as: 'owner', attributes: ['id', 'username', 'email'] },
          { model: db.Dataset, as: 'dataset', attributes: ['id', 'name', 'description'] }
        ]
      });
      if (!result) {
        throw new AppError('Model not found.', 404);
      }
      logger.debug(`Fetched model by ID ${id} from DB (cache miss).`);
      return result;
    });
    logger.debug(`Fetched model by ID: ${id}`);
    return model;
  } catch (error) {
    logger.error(`Error fetching model by ID ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not retrieve model.', 500);
  }
};

const createModel = async (modelData, ownerId) => {
  try {
    const newModel = await db.Model.create({ ...modelData, owner_id: ownerId });
    // Invalidate cache for all models
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_MODELS);
    logger.info(`Model created: ${newModel.name} (${newModel.id}) by user ${ownerId}`);
    return newModel;
  } catch (error) {
    logger.error('Error creating model:', error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Model with that name already exists.', 400);
    }
    if (error.name === 'SequelizeValidationError') {
      throw new AppError(error.errors.map(e => e.message).join(', '), 400);
    }
    throw new AppError('Could not create model.', 500);
  }
};

const updateModel = async (id, modelData) => {
  try {
    const model = await db.Model.findByPk(id);
    if (!model) {
      throw new AppError('Model not found.', 404);
    }
    await model.update(modelData);
    // Invalidate cache for this specific model and all models
    db.sequelize.cacheManager.del(`model-${id}`);
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_MODELS);
    logger.info(`Model updated: ${model.name} (${model.id})`);
    return model;
  } catch (error) {
    logger.error(`Error updating model ${id}:`, error);
    if (error.name === 'AppError') throw error;
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new AppError('Model with that name already exists.', 400);
    }
    if (error.name === 'SequelizeValidationError') {
      throw new AppError(error.errors.map(e => e.message).join(', '), 400);
    }
    throw new AppError('Could not update model.', 500);
  }
};

const deleteModel = async (id) => {
  try {
    const model = await db.Model.findByPk(id);
    if (!model) {
      throw new AppError('Model not found.', 404);
    }
    await model.destroy();
    // Invalidate cache for this specific model and all models
    db.sequelize.cacheManager.del(`model-${id}`);
    db.sequelize.cacheManager.del(CACHE_KEY_ALL_MODELS);
    logger.info(`Model deleted: ${id}`);
    return { message: 'Model deleted successfully.' };
  } catch (error) {
    logger.error(`Error deleting model ${id}:`, error);
    if (error.name === 'AppError') throw error;
    throw new AppError('Could not delete model.', 500);
  }
};

// Simulate inference for a model
const runInference = async (modelId, payload) => {
  const startTime = process.hrtime.bigint();
  let status = 'error';
  let responsePayload = {};
  let duration_ms = null;

  try {
    const model = await db.Model.findByPk(modelId);
    if (!model) {
      throw new AppError('Model not found.', 404);
    }

    logger.info(`Simulating inference for model ${model.name} (${modelId}) with payload: ${JSON.stringify(payload)}`);

    // Simulate an external API call
    await new Promise(resolve => setTimeout(Math.random() * 500 + 100, resolve)); // Simulate 100-600ms latency

    // Simulate different responses based on model type or input
    if (model.type === 'classification') {
      const randomProb = Math.random();
      const prediction = randomProb > 0.5 ? 'positive' : 'negative';
      responsePayload = {
        prediction: prediction,
        probability: prediction === 'positive' ? randomProb : 1 - randomProb,
        input_received: payload
      };
    } else if (model.type === 'regression') {
      const simulatedValue = 100 + Math.random() * 1000;
      responsePayload = {
        predicted_value: parseFloat(simulatedValue.toFixed(2)),
        confidence: 0.95,
        input_received: payload
      };
    } else {
      responsePayload = {
        message: 'Inference simulated successfully for "other" type model.',
        received_data: payload,
        timestamp: new Date().toISOString()
      };
    }
    status = 'success';
    logger.info(`Inference for model ${model.name} successful.`);
    return responsePayload;
  } catch (error) {
    logger.error(`Error during inference for model ${modelId}:`, error);
    if (error.name === 'AppError') {
      responsePayload = { error: error.message };
      throw error;
    }
    responsePayload = { error: 'Failed to run inference simulation.' };
    throw new AppError('Failed to run inference simulation.', 500);
  } finally {
    const endTime = process.hrtime.bigint();
    duration_ms = Number(endTime - startTime) / 1_000_000;

    await db.InferenceLog.create({
      model_id: modelId,
      request_payload: payload,
      response_payload: responsePayload,
      status: status,
      duration_ms: duration_ms,
      timestamp: new Date()
    });
    logger.debug(`Inference log created for model ${modelId} with status ${status} and duration ${duration_ms}ms.`);
  }
};


module.exports = {
  getAllModels,
  getModelById,
  createModel,
  updateModel,
  deleteModel,
  runInference
};
```