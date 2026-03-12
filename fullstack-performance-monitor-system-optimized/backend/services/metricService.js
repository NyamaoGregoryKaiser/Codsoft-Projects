```javascript
const { Metric, Application, Alert } = require('../models');
const logger = require('../utils/logger');
const { Op } = require('sequelize');

// Define valid metric types
const VALID_METRIC_TYPES = ['cpu', 'memory', 'request_latency', 'error_rate'];

/**
 * Collects and stores a new metric data point.
 * @param {string} applicationId - The ID of the application sending the metric.
 * @param {object} metricData - Metric data (type, value, optional timestamp).
 * @returns {object} - The newly created metric object.
 * @throws {Error} If validation fails or application not found.
 */
const collectMetric = async (applicationId, metricData) => {
  const { type, value, timestamp } = metricData;

  if (!type || !value) {
    throw new Error('Metric type and value are required.');
  }
  if (!VALID_METRIC_TYPES.includes(type)) {
    throw new Error(`Invalid metric type: ${type}. Valid types are: ${VALID_METRIC_TYPES.join(', ')}`);
  }
  if (typeof value !== 'number' || isNaN(value)) {
    throw new Error('Metric value must be a number.');
  }

  try {
    const newMetric = await Metric.create({
      applicationId,
      type,
      value,
      timestamp: timestamp || new Date(),
    });
    // logger.debug(`Metric collected for app ${applicationId}: ${type} = ${value}`); // Too verbose for info, debug is fine

    // Optionally, trigger alert check asynchronously
    process.nextTick(() => checkAndTriggerAlerts(applicationId, type, value, newMetric.timestamp));

    return newMetric;
  } catch (error) {
    logger.error(`Error collecting metric for application ${applicationId}:`, error.message);
    throw new Error(`Failed to collect metric: ${error.message}`);
  }
};

/**
 * Retrieves historical metrics for a specific application and metric type.
 * @param {string} applicationId - The ID of the application.
 * @param {string} metricType - The type of metric (e.g., 'cpu', 'memory').
 * @param {string} period - Time period (e.g., '1h', '24h', '7d', '30d').
 * @returns {Array<object>} - An array of metric data points.
 * @throws {Error} If invalid period or metric type.
 */
const getMetricsByApplicationAndType = async (applicationId, metricType, period = '24h') => {
  if (!VALID_METRIC_TYPES.includes(metricType)) {
    throw new Error(`Invalid metric type: ${metricType}`);
  }

  let startTime;
  const now = new Date();
  switch (period) {
    case '1h': startTime = new Date(now.getTime() - 1 * 60 * 60 * 1000); break;
    case '24h': startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
    case '7d': startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
    case '30d': startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
    default: throw new Error('Invalid time period specified. Use 1h, 24h, 7d, or 30d.');
  }

  try {
    const metrics = await Metric.findAll({
      where: {
        applicationId,
        type: metricType,
        timestamp: {
          [Op.gte]: startTime,
        },
      },
      order: [['timestamp', 'ASC']],
      attributes: ['value', 'timestamp'], // Only select necessary fields
    });

    // Simple aggregation for larger periods (e.g., average every X data points)
    // For a more robust solution, use time-series database or pre-aggregated tables
    if (period === '7d' || period === '30d') {
      const aggregateIntervalMs = period === '7d' ? 6 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 6h for 7d, 24h for 30d
      return aggregateMetrics(metrics, aggregateIntervalMs);
    }

    return metrics;
  } catch (error) {
    logger.error(`Error fetching metrics for app ${applicationId}, type ${metricType}, period ${period}:`, error.message);
    throw new Error(`Failed to retrieve metrics: ${error.message}`);
  }
};

/**
 * Aggregates raw metrics into a coarser granularity.
 * @param {Array<object>} metrics - Raw metric data points.
 * @param {number} intervalMs - The aggregation interval in milliseconds.
 * @returns {Array<object>} - Aggregated metric data points (average).
 */
const aggregateMetrics = (metrics, intervalMs) => {
  if (!metrics || metrics.length === 0) return [];

  const aggregated = [];
  let currentBucket = null;
  let sum = 0;
  let count = 0;

  for (const metric of metrics) {
    const timestamp = new Date(metric.timestamp).getTime();
    if (currentBucket === null) {
      currentBucket = Math.floor(timestamp / intervalMs) * intervalMs;
    }

    // If metric falls into a new bucket, save the current bucket's average and start a new one
    if (timestamp >= currentBucket + intervalMs) {
      if (count > 0) {
        aggregated.push({
          timestamp: new Date(currentBucket),
          value: sum / count,
        });
      }
      currentBucket = Math.floor(timestamp / intervalMs) * intervalMs;
      sum = 0;
      count = 0;
    }

    sum += metric.value;
    count++;
  }

  // Add the last bucket
  if (count > 0) {
    aggregated.push({
      timestamp: new Date(currentBucket),
      value: sum / count,
    });
  }

  return aggregated;
};

/**
 * Checks for active alerts and triggers them if thresholds are exceeded.
 * This function is meant to be called asynchronously after metric collection.
 * @param {string} applicationId - The ID of the application.
 * @param {string} metricType - The type of metric.
 * @param {number} currentValue - The current value of the metric.
 * @param {Date} timestamp - The timestamp of the metric.
 */
const checkAndTriggerAlerts = async (applicationId, metricType, currentValue, timestamp) => {
  try {
    const activeAlerts = await Alert.findAll({
      where: {
        applicationId,
        metricType,
        status: 'active',
      },
    });

    for (const alert of activeAlerts) {
      let isTriggered = false;
      switch (alert.operator) {
        case '>': isTriggered = currentValue > alert.thresholdValue; break;
        case '<': isTriggered = currentValue < alert.thresholdValue; break;
        case '>=': isTriggered = currentValue >= alert.thresholdValue; break;
        case '<=': isTriggered = currentValue <= alert.thresholdValue; break;
        case '=': isTriggered = currentValue === alert.thresholdValue; break;
        default: break;
      }

      if (isTriggered) {
        // Prevent re-triggering the same alert repeatedly if still in violation
        // A more sophisticated system would track recent triggers
        logger.warn(`Alert triggered for app ${applicationId}, type ${metricType}: ${alert.message} (Current: ${currentValue}, Threshold: ${alert.operator} ${alert.thresholdValue})`);

        // Update alert status to 'triggered' and log the time
        await alert.update({
          status: 'triggered',
          triggeredAt: timestamp,
          message: `${alert.message} - Current value: ${currentValue} at ${timestamp.toISOString()}`
        });

        // In a real system, send notifications (email, SMS, Slack, PagerDuty)
        // For now, just log it.
        logger.info(`Notification: Alert "${alert.message}" triggered for ${applicationId}.`);
      }
    }
  } catch (error) {
    logger.error(`Error checking/triggering alerts for app ${applicationId}, metric ${metricType}:`, error.message);
  }
};

/**
 * Retrieves all alerts for a given application.
 * @param {string} applicationId - The ID of the application.
 * @returns {Array<object>} - An array of alert objects.
 */
const getApplicationAlerts = async (applicationId) => {
  try {
    const alerts = await Alert.findAll({
      where: { applicationId },
      order: [['triggeredAt', 'DESC'], ['createdAt', 'DESC']],
    });
    return alerts;
  } catch (error) {
    logger.error(`Error fetching alerts for application ${applicationId}:`, error.message);
    throw new Error(`Failed to retrieve alerts: ${error.message}`);
  }
};

/**
 * Creates a new alert for an application.
 * @param {string} applicationId - The ID of the application.
 * @param {object} alertData - Alert configuration data.
 * @returns {object} - The newly created alert object.
 */
const createAlert = async (applicationId, alertData) => {
  const { metricType, thresholdValue, operator, message } = alertData;

  if (!metricType || !thresholdValue || !operator) {
    throw new Error('Metric type, threshold value, and operator are required for an alert.');
  }
  if (!VALID_METRIC_TYPES.includes(metricType)) {
    throw new Error(`Invalid metric type: ${metricType}. Valid types are: ${VALID_METRIC_TYPES.join(', ')}`);
  }
  const VALID_OPERATORS = ['>', '<', '>=', '<=', '='];
  if (!VALID_OPERATORS.includes(operator)) {
    throw new Error(`Invalid operator: ${operator}. Valid operators are: ${VALID_OPERATORS.join(', ')}`);
  }

  try {
    const newAlert = await Alert.create({
      applicationId,
      metricType,
      thresholdValue,
      operator,
      message: message || `Alert for ${metricType} when value is ${operator} ${thresholdValue}`,
      status: 'active',
    });
    logger.info(`Alert created for application ${applicationId}: ${newAlert.message}`);
    return newAlert;
  } catch (error) {
    logger.error(`Error creating alert for application ${applicationId}:`, error.message);
    throw new Error(`Failed to create alert: ${error.message}`);
  }
};

/**
 * Updates an existing alert.
 * @param {string} alertId - The ID of the alert to update.
 * @param {object} updateData - Data to update (metricType, thresholdValue, operator, message, status).
 * @returns {object} - Updated alert object.
 */
const updateAlert = async (alertId, updateData) => {
  try {
    const alert = await Alert.findByPk(alertId);
    if (!alert) {
      throw new Error('Alert not found.');
    }

    const { metricType, thresholdValue, operator, message, status } = updateData;

    if (metricType && !VALID_METRIC_TYPES.includes(metricType)) {
      throw new Error(`Invalid metric type: ${metricType}`);
    }
    const VALID_OPERATORS = ['>', '<', '>=', '<=', '='];
    if (operator && !VALID_OPERATORS.includes(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }
    const VALID_STATUSES = ['active', 'triggered', 'resolved', 'disabled'];
    if (status && !VALID_STATUSES.includes(status)) {
      throw new Error(`Invalid status: ${status}`);
    }

    if (metricType) alert.metricType = metricType;
    if (thresholdValue !== undefined) alert.thresholdValue = thresholdValue;
    if (operator) alert.operator = operator;
    if (message !== undefined) alert.message = message;
    if (status) {
      alert.status = status;
      if (status === 'resolved' && !alert.resolvedAt) {
        alert.resolvedAt = new Date();
      } else if (status === 'active' || status === 'disabled') {
        alert.resolvedAt = null; // Clear resolved time if reactivated/disabled
      }
    }

    await alert.save();
    logger.info(`Alert ${alertId} updated successfully.`);
    return alert;
  } catch (error) {
    logger.error(`Error updating alert ${alertId}:`, error.message);
    throw new Error(`Failed to update alert: ${error.message}`);
  }
};

/**
 * Deletes an alert.
 * @param {string} alertId - The ID of the alert to delete.
 * @returns {boolean} - True if deletion was successful.
 */
const deleteAlert = async (alertId) => {
  try {
    const deletedRows = await Alert.destroy({ where: { id: alertId } });
    if (deletedRows === 0) {
      throw new Error('Alert not found.');
    }
    logger.info(`Alert ${alertId} deleted successfully.`);
    return true;
  } catch (error) {
    logger.error(`Error deleting alert ${alertId}:`, error.message);
    throw new Error(`Failed to delete alert: ${error.message}`);
  }
};


module.exports = {
  collectMetric,
  getMetricsByApplicationAndType,
  getApplicationAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  VALID_METRIC_TYPES,
  checkAndTriggerAlerts // Export for testing/manual trigger if needed
};
```