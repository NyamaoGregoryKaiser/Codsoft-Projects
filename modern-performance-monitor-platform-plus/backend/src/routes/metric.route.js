```javascript
const express = require('express');
const metricController = require('../controllers/metricController');
const { auth, apiKeyAuth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

const ingestMetricSchema = {
  body: Joi.object().keys({
    metricType: Joi.string().required(),
    timestamp: Joi.date().iso().required(),
    data: Joi.object().required().unknown(), // Flexible object for metric data
  }),
};

const getMetricsSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    metricType: Joi.string(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

const getAggregatedMetricsSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    metricType: Joi.string().required(),
    field: Joi.string().required(), // e.g., 'durationMs', 'status'
    aggregationType: Joi.string().valid('avg', 'sum', 'count', 'max', 'min').required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
    interval: Joi.string().valid('minute', '5 minutes', '10 minutes', '15 minutes', '30 minutes', 'hour', 'day', 'week', 'month', 'year').default('hour'),
  }),
};

// Endpoint for external applications to send metric data
router.post('/ingest', apiKeyAuth(), validate(ingestMetricSchema), metricController.ingestMetric);

// Endpoints for authenticated users to view metric data
router.get('/:projectId', auth(), validate(getMetricsSchema), metricController.getMetrics);
router.get('/:projectId/aggregated', auth(), validate(getAggregatedMetricsSchema), metricController.getAggregatedMetrics);

module.exports = router;
```