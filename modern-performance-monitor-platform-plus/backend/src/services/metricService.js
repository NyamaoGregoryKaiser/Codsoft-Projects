```javascript
const { v4: uuidv4 } = require('uuid');
const { metricRepository } = require('../data-access/repositories');
const logger = require('../utils/logger');
const httpStatus = require('http-status');
const { ApiError } = require('../utils/errorHandler');

const ingestMetric = async (projectId, metricBody) => {
  const { metricType, timestamp, data } = metricBody;

  if (!metricType || !timestamp || !data) {
    throw new ApiError('Missing required metric fields: metricType, timestamp, data', httpStatus.BAD_REQUEST);
  }

  const metric = {
    id: uuidv4(),
    project_id: projectId,
    metric_type: metricType,
    timestamp: new Date(timestamp).toISOString(), // Ensure ISO format
    data: data,
  };

  const ingested = await metricRepository.ingestMetric(metric);
  logger.debug(`Metric ingested for project ${projectId}, type: ${metricType}`);
  return ingested;
};

const getMetricsByProjectId = async (projectId, queryParams) => {
  const { metricType, startTime, endTime, limit, offset } = queryParams;

  if (!startTime || !endTime) {
    throw new ApiError('startTime and endTime are required query parameters', httpStatus.BAD_REQUEST);
  }

  // Ensure user has access to project (handled by controller/middleware implicitly if passed userId)
  // For simplicity, we assume project_id passed here is valid and authorized.

  const metrics = await metricRepository.getMetrics(
    projectId,
    metricType,
    startTime,
    endTime,
    parseInt(limit, 10) || 100,
    parseInt(offset, 10) || 0
  );
  return metrics;
};

const getAggregatedMetricsByProjectId = async (projectId, queryParams) => {
  const { metricType, field, aggregationType, startTime, endTime, interval } = queryParams;

  if (!metricType || !field || !aggregationType || !startTime || !endTime || !interval) {
    throw new ApiError('Missing required aggregation query parameters: metricType, field, aggregationType, startTime, endTime, interval', httpStatus.BAD_REQUEST);
  }

  const validAggregationTypes = ['avg', 'sum', 'count', 'max', 'min'];
  if (!validAggregationTypes.includes(aggregationType)) {
    throw new ApiError(`Invalid aggregationType. Must be one of: ${validAggregationTypes.join(', ')}`, httpStatus.BAD_REQUEST);
  }

  // Interval validation (basic check, could be more robust)
  const validIntervals = ['minute', '5 minutes', '10 minutes', '15 minutes', '30 minutes', 'hour', 'day', 'week', 'month', 'year'];
  if (!validIntervals.includes(interval)) {
      throw new ApiError(`Invalid interval. Must be one of: ${validIntervals.join(', ')}`, httpStatus.BAD_REQUEST);
  }

  const aggregatedMetrics = await metricRepository.getAggregatedMetrics(
    projectId,
    metricType,
    `data->>'${field}'`, // Access JSONB field
    aggregationType,
    startTime,
    endTime,
    interval
  );
  return aggregatedMetrics;
};

// This function would be called periodically by a background job/cron to check alert conditions
const evaluateAlerts = async (projectId) => {
  // This is a placeholder for a complex alerting logic.
  // In a real system, this would involve:
  // 1. Fetching active alerts for the project.
  // 2. For each alert, query metric data for its specified time window.
  // 3. Apply the aggregation and threshold logic.
  // 4. If triggered, create an alert incident (if one doesn't already exist for this condition).
  // 5. If a triggered alert resolves, update its incident.
  logger.info(`Evaluating alerts for project ${projectId}... (This is a placeholder for actual alert evaluation logic)`);

  // Example: fetch some alerts
  // const alerts = await alertRepository.getAlertsByProjectId(projectId);
  // for (const alert of alerts) {
  //   // ... logic to query metricRepository.getAggregatedMetrics
  //   // ... compare to alert.threshold
  //   // ... create/update alert incident
  // }
  return { message: `Alert evaluation initiated for project ${projectId}` };
};

module.exports = {
  ingestMetric,
  getMetricsByProjectId,
  getAggregatedMetricsByProjectId,
  evaluateAlerts,
};
```