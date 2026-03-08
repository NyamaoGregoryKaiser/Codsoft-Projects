```javascript
const httpStatus = require('http-status');
const { metricService } = require('../services');
const catchAsync = require('../utils/catchAsync');

// Endpoint for monitored applications to send metrics
const ingestMetric = catchAsync(async (req, res) => {
  // req.project is set by apiKeyAuth middleware
  const metric = await metricService.ingestMetric(req.project.id, req.body);
  res.status(httpStatus.CREATED).send({ message: 'Metric ingested successfully', metricId: metric.id });
});

// Endpoint for authenticated users to retrieve raw metrics for their projects
const getMetrics = catchAsync(async (req, res) => {
  const metrics = await metricService.getMetricsByProjectId(req.params.projectId, req.query);
  res.send(metrics);
});

// Endpoint for authenticated users to retrieve aggregated metrics for their projects
const getAggregatedMetrics = catchAsync(async (req, res) => {
  const aggregatedMetrics = await metricService.getAggregatedMetricsByProjectId(req.params.projectId, req.query);
  res.send(aggregatedMetrics);
});

module.exports = {
  ingestMetric,
  getMetrics,
  getAggregatedMetrics,
};
```