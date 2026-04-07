```javascript
const datasetService = require('../services/datasetService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getAllDatasets = catchAsync(async (req, res, next) => {
  const datasets = await datasetService.getAllDatasets();
  res.status(200).json({
    status: 'success',
    results: datasets.length,
    data: {
      datasets,
    },
  });
});

exports.getDataset = catchAsync(async (req, res, next) => {
  const dataset = await datasetService.getDatasetById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      dataset,
    },
  });
});

exports.createDataset = catchAsync(async (req, res, next) => {
  const newDataset = await datasetService.createDataset(req.body, req.user.id);
  res.status(201).json({
    status: 'success',
    data: {
      dataset: newDataset,
    },
  });
});

exports.updateDataset = catchAsync(async (req, res, next) => {
  const updatedDataset = await datasetService.updateDataset(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: {
      dataset: updatedDataset,
    },
  });
});

exports.deleteDataset = catchAsync(async (req, res, next) => {
  await datasetService.deleteDataset(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
```