```javascript
const inferenceLogService = require('../services/inferenceLogService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

exports.getInferenceLogs = catchAsync(async (req, res, next) => {
  const { modelId, page, limit, startDate, endDate, status } = req.query;

  const logs = await inferenceLogService.getInferenceLogs(
    modelId,
    parseInt(page, 10) || 1,
    parseInt(limit, 10) || 10,
    startDate,
    endDate,
    status
  );

  res.status(200).json({
    status: 'success',
    ...logs,
  });
});

exports.getInferenceLog = catchAsync(async (req, res, next) => {
  const log = await inferenceLogService.getInferenceLogById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: {
      log,
    },
  });
});
```