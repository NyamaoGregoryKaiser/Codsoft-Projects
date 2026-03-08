```javascript
const db = require('../db');
const moment = require('moment'); // For date manipulation

const TABLE_NAME = 'metric_data';

const ingestMetric = async (metric) => {
  const [ingestedMetric] = await db(TABLE_NAME).insert(metric).returning('*');
  return ingestedMetric;
};

const getMetrics = async (projectId, metricType, startTime, endTime, limit = 100, offset = 0) => {
  return db(TABLE_NAME)
    .where({ project_id: projectId })
    .andWhere((builder) => {
      if (metricType) {
        builder.where('metric_type', metricType);
      }
    })
    .andWhere('timestamp', '>=', moment(startTime).toISOString())
    .andWhere('timestamp', '<=', moment(endTime).toISOString())
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .offset(offset);
};

const getAggregatedMetrics = async (projectId, metricType, field, aggregationType, startTime, endTime, interval = '1 hour') => {
  // Sanitize field for JSONB access
  const safeField = field.replace(/'/g, "''"); // Escape single quotes

  let aggregationFunction;
  switch (aggregationType) {
    case 'avg':
      aggregationFunction = `AVG((${safeField})::float)`;
      break;
    case 'sum':
      aggregationFunction = `SUM((${safeField})::float)`;
      break;
    case 'count':
      aggregationFunction = `COUNT((${safeField})::float)`; // Count non-null values for the field
      break;
    case 'max':
      aggregationFunction = `MAX((${safeField})::float)`;
      break;
    case 'min':
      aggregationFunction = `MIN((${safeField})::float)`;
      break;
    default:
      throw new Error('Invalid aggregation type');
  }

  // Example interval: '1 hour', '1 day', '5 minutes'
  // PostgreSQL DATE_TRUNC function
  const query = db(TABLE_NAME)
    .select(
      db.raw(`DATE_TRUNC(?, timestamp) as interval_start`, [interval]),
      db.raw(`${aggregationFunction} as value`)
    )
    .where({ project_id: projectId, metric_type: metricType })
    .andWhere('timestamp', '>=', moment(startTime).toISOString())
    .andWhere('timestamp', '<=', moment(endTime).toISOString())
    .groupBy(db.raw(`DATE_TRUNC(?, timestamp)`, [interval]))
    .orderBy('interval_start', 'asc');

  return query;
};

module.exports = {
  ingestMetric,
  getMetrics,
  getAggregatedMetrics,
};
```