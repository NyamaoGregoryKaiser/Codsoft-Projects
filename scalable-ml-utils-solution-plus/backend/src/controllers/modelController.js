```javascript
const modelService = require('../services/modelService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getAllModels = catchAsync(async (req, res, next) => {
  const models = await modelService.getAllModels();
  res.status(200).json({
    status: 'success',
    results: models.length,
    data: {
      models,
    },
  });
});

exports.getModel = catchAsync(async (req, res, next) => {
  const model = await modelService.getModelById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      model,
    },
  });
});

exports.createModel = catchAsync(async (req, res, next) => {
  const newModel = await modelService.createModel(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: {
      model: newModel,
    },
  });
});

exports.updateModel = catchAsync(async (req, res, next) => {
  const updatedModel = await modelService.updateModel(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: {
      model: updatedModel,
    },
  });
});

exports.deleteModel = catchAsync(async (req, res, next) => {
  await modelService.deleteModel(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.runInference = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return next(new AppError('Inference payload cannot be empty.', 400));
  }

  const result = await modelService.runInference(id, payload);

  res.status(200).json({
    status: 'success',
    data: {
      inference_result: result,
    },
  });
});
```