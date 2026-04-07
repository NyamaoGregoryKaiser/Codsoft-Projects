```javascript
const modelService = require('../../services/modelService');
const db = require('../../db');
const AppError = require('../../utils/appError');
const { setupTestDB, insertUsers, adminUser, regularUser } = require('../fixtures/db.fixture');
const { cache } = require('../../utils/cacheManager');

describe('Model Service Integration Tests', () => {
  let user1, admin;
  let dataset1, dataset2;

  beforeAll(async () => {
    db.sequelize.options.database = 'ml_utilities_test_db'; // Ensure test DB
    await setupTestDB(); // Clean and re-sync DB for tests
    [admin, user1] = await insertUsers([adminUser, regularUser]);
  });

  beforeEach(async () => {
    await db.Model.destroy({ truncate: true, cascade: true });
    await db.Dataset.destroy({ truncate: true, cascade: true });
    await db.InferenceLog.destroy({ truncate: true, cascade: true });
    cache.flushAll(); // Clear cache before each test
    // Create datasets for models
    dataset1 = await db.Dataset.create({
      name: 'Test Dataset 1',
      description: 'Description 1',
      schema_preview: { features: ['f1'] },
      owner_id: user1.id
    });
    dataset2 = await db.Dataset.create({
      name: 'Test Dataset 2',
      description: 'Description 2',
      schema_preview: { features: ['f2'] },
      owner_id: admin.id
    });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  describe('createModel', () => {
    test('should create a new model and invalidate cache', async () => {
      const modelData = {
        name: 'New Test Model',
        description: 'A new model',
        type: 'classification',
        endpoint_url: 'http://test.com/new',
        dataset_id: dataset1.id,
      };

      // Populate cache first
      await modelService.getAllModels();
      expect(cache.keys()).toContain('allModels');

      const newModel = await modelService.createModel(modelData, user1.id);

      expect(newModel).toBeDefined();
      expect(newModel.name).toBe(modelData.name);
      expect(newModel.owner_id).toBe(user1.id);
      expect(cache.keys()).not.toContain('allModels'); // Cache should be invalidated
    });

    test('should throw AppError for duplicate model name', async () => {
      const modelData = {
        name: 'Duplicate Model',
        description: 'A model',
        type: 'classification',
        endpoint_url: 'http://test.com/dup',
        dataset_id: dataset1.id,
      };
      await modelService.createModel(modelData, user1.id);

      await expect(modelService.createModel(modelData, user1.id)).rejects.toThrow(AppError);
      await expect(modelService.createModel(modelData, user1.id)).rejects.toHaveProperty('statusCode', 400);
    });

    test('should throw AppError for invalid endpoint URL', async () => {
      const modelData = {
        name: 'Invalid URL Model',
        description: 'A model',
        type: 'classification',
        endpoint_url: 'invalid-url',
        dataset_id: dataset1.id,
      };
      await expect(modelService.createModel(modelData, user1.id)).rejects.toThrow(AppError);
      await expect(modelService.createModel(modelData, user1.id)).rejects.toHaveProperty('statusCode', 400);
    });
  });

  describe('getAllModels', () => {
    test('should retrieve all models with owner and dataset info', async () => {
      const model1 = await db.Model.create({
        name: 'Model 1',
        endpoint_url: 'http://e1.com',
        owner_id: user1.id,
        dataset_id: dataset1.id
      });
      const model2 = await db.Model.create({
        name: 'Model 2',
        endpoint_url: 'http://e2.com',
        owner_id: admin.id,
        dataset_id: dataset2.id
      });

      const models = await modelService.getAllModels();
      expect(models.length).toBe(2);
      expect(models[0].owner.username).toBe(user1.username);
      expect(models[0].dataset.name).toBe(dataset1.name);
      expect(models[1].owner.username).toBe(admin.username);
      expect(models[1].dataset.name).toBe(dataset2.name);
      expect(cache.keys()).toContain('allModels'); // Cache should be populated
    });

    test('should retrieve from cache on subsequent calls', async () => {
      await db.Model.create({
        name: 'Model 1',
        endpoint_url: 'http://e1.com',
        owner_id: user1.id,
        dataset_id: dataset1.id
      });

      await modelService.getAllModels(); // Populates cache
      const initialCacheHits = cache.getStats().hits;
      const modelsFromCache = await modelService.getAllModels(); // Should hit cache

      expect(modelsFromCache.length).toBe(1);
      expect(cache.getStats().hits).toBe(initialCacheHits + 1);
    });
  });

  describe('getModelById', () => {
    let model;
    beforeEach(async () => {
      model = await db.Model.create({
        name: 'Specific Test Model',
        endpoint_url: 'http://specific.com',
        owner_id: user1.id,
        dataset_id: dataset1.id
      });
    });

    test('should retrieve a model by ID with owner and dataset info', async () => {
      const fetchedModel = await modelService.getModelById(model.id);
      expect(fetchedModel).toBeDefined();
      expect(fetchedModel.id).toBe(model.id);
      expect(fetchedModel.owner.username).toBe(user1.username);
      expect(fetchedModel.dataset.name).toBe(dataset1.name);
      expect(cache.keys()).toContain(`model-${model.id}`);
    });

    test('should throw AppError if model not found', async () => {
      await expect(modelService.getModelById('invalid-id')).rejects.toThrow(AppError);
      await expect(modelService.getModelById('invalid-id')).rejects.toHaveProperty('statusCode', 404);
    });

    test('should retrieve from cache on subsequent calls', async () => {
      await modelService.getModelById(model.id); // Populates cache
      const initialCacheHits = cache.getStats().hits;
      const modelFromCache = await modelService.getModelById(model.id); // Should hit cache

      expect(modelFromCache.id).toBe(model.id);
      expect(cache.getStats().hits).toBe(initialCacheHits + 1);
    });
  });

  describe('updateModel', () => {
    let model;
    beforeEach(async () => {
      model = await db.Model.create({
        name: 'Model to Update',
        endpoint_url: 'http://old.com',
        owner_id: user1.id,
        dataset_id: dataset1.id
      });
    });

    test('should update a model and invalidate relevant caches', async () => {
      const updatedData = {
        name: 'Updated Model Name',
        endpoint_url: 'http://new.com',
        description: 'New Description',
      };

      // Populate cache first
      await modelService.getAllModels();
      await modelService.getModelById(model.id);
      expect(cache.keys()).toContain('allModels');
      expect(cache.keys()).toContain(`model-${model.id}`);

      const updatedModel = await modelService.updateModel(model.id, updatedData);

      expect(updatedModel).toBeDefined();
      expect(updatedModel.name).toBe(updatedData.name);
      expect(updatedModel.endpoint_url).toBe(updatedData.endpoint_url);
      expect(cache.keys()).not.toContain('allModels');
      expect(cache.keys()).not.toContain(`model-${model.id}`);
    });

    test('should throw AppError if model not found', async () => {
      await expect(modelService.updateModel('invalid-id', { name: 'Nonexistent' })).rejects.toThrow(AppError);
      await expect(modelService.updateModel('invalid-id', { name: 'Nonexistent' })).rejects.toHaveProperty('statusCode', 404);
    });

    test('should throw AppError for duplicate name on update', async () => {
      await db.Model.create({
        name: 'Another Model',
        endpoint_url: 'http://another.com',
        owner_id: admin.id,
        dataset_id: dataset2.id
      });
      await expect(modelService.updateModel(model.id, { name: 'Another Model' })).rejects.toThrow(AppError);
      await expect(modelService.updateModel(model.id, { name: 'Another Model' })).rejects.toHaveProperty('statusCode', 400);
    });
  });

  describe('deleteModel', () => {
    let model;
    beforeEach(async () => {
      model = await db.Model.create({
        name: 'Model to Delete',
        endpoint_url: 'http://delete.com',
        owner_id: user1.id,
        dataset_id: dataset1.id
      });
    });

    test('should delete a model and invalidate relevant caches', async () => {
      // Populate cache first
      await modelService.getAllModels();
      await modelService.getModelById(model.id);
      expect(cache.keys()).toContain('allModels');
      expect(cache.keys()).toContain(`model-${model.id}`);

      await modelService.deleteModel(model.id);
      const foundModel = await db.Model.findByPk(model.id);
      expect(foundModel).toBeNull();
      expect(cache.keys()).not.toContain('allModels');
      expect(cache.keys()).not.toContain(`model-${model.id}`);
    });

    test('should throw AppError if model not found', async () => {
      await expect(modelService.deleteModel('invalid-id')).rejects.toThrow(AppError);
      await expect(modelService.deleteModel('invalid-id')).rejects.toHaveProperty('statusCode', 404);
    });
  });

  describe('runInference', () => {
    let model;
    beforeEach(async () => {
      model = await db.Model.create({
        name: 'Inference Model',
        endpoint_url: 'http://inference.com',
        owner_id: user1.id,
        type: 'classification'
      });
    });

    test('should run a simulated inference and log it', async () => {
      const payload = { feature1: 10, feature2: 'test' };
      const result = await modelService.runInference(model.id, payload);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('prediction');
      expect(result).toHaveProperty('probability');

      const logs = await db.InferenceLog.findAll({ where: { model_id: model.id } });
      expect(logs.length).toBe(1);
      expect(logs[0].request_payload).toEqual(payload);
      expect(logs[0].response_payload).toEqual(result);
      expect(logs[0].status).toBe('success');
      expect(logs[0].duration_ms).toBeGreaterThan(0);
    });

    test('should log error status if inference fails', async () => {
      // Simulate an error by attempting inference on a non-existent model ID
      const payload = { data: 'some_data' };
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(modelService.runInference(nonExistentId, payload)).rejects.toThrow(AppError);

      // Check if an error log was created (should not for non-existent model before finding it)
      // The service logs inside the catch/finally block, so it should still log "error"
      const logs = await db.InferenceLog.findAll({ where: { model_id: nonExistentId } });
      expect(logs.length).toBe(1); // One log should be created
      expect(logs[0].request_payload).toEqual(payload);
      expect(logs[0].status).toBe('error');
      expect(logs[0].response_payload).toHaveProperty('error');
    });
  });
});
```