```javascript
const metricService = require('../services/metricService');
const logger = require('../utils/logger');

/**
 * Handles incoming metric data from an application.
 * Requires API Key authentication. `req.application` is populated by `authenticateApiKey` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const collectMetric = async (req, res, next) => {
  try {
    const applicationId = req.application.id; // From API Key authentication
    const { type, value, timestamp } = req.body;

    const newMetric = await metricService.collectMetric(applicationId, { type, value, timestamp });

    res.status(201).json({
      status: 'success',
      data: newMetric,
      message: 'Metric collected successfully.',
    });
  } catch (error) {
    logger.error(`Error collecting metric for application ${req.application ? req.application.id : 'N/A'}:`, error.message);
    next(error);
  }
};

/**
 * Retrieves historical metrics for a specific application and metric type.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getMetrics = async (req, res, next) => {
  try {
    const { appId, metricType } = req.params;
    const { period } = req.query; // e.g., '24h', '7d'

    const metrics = await metricService.getMetricsByApplicationAndType(appId, metricType, period);

    res.status(200).json({
      status: 'success',
      data: metrics,
      message: `Metrics for ${metricType} retrieved successfully.`,
    });
  } catch (error) {
    logger.error(`Error getting metrics for app ${req.params.appId}, type ${req.params.metricType}:`, error.message);
    next(error);
  }
};

/**
 * Retrieves all alerts for a specific application.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const getAlerts = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const alerts = await metricService.getApplicationAlerts(appId);
    res.status(200).json({
      status: 'success',
      data: alerts,
      message: 'Alerts retrieved successfully.',
    });
  } catch (error) {
    logger.error(`Error getting alerts for app ${req.params.appId}:`, error.message);
    next(error);
  }
};

/**
 * Creates a new alert for an application.
 * Requires authentication and authorization.
 * `req.application` is populated by `authorizeApplicationOwner` middleware.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const createAlert = async (req, res, next) => {
  try {
    const { appId } = req.params;
    const newAlert = await metricService.createAlert(appId, req.body);
    res.status(201).json({
      status: 'success',
      data: newAlert,
      message: 'Alert created successfully.',
    });
  } catch (error) {
    logger.error(`Error creating alert for app ${req.params.appId}:`, error.message);
    next(error);
  }
};

/**
 * Updates an existing alert for an application.
 * Requires authentication and authorization.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const updateAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params; // Expect alertId from URL params
    const updatedAlert = await metricService.updateAlert(alertId, req.body);
    res.status(200).json({
      status: 'success',
      data: updatedAlert,
      message: 'Alert updated successfully.',
    });
  } catch (error) {
    logger.error(`Error updating alert ${req.params.alertId}:`, error.message);
    next(error);
  }
};

/**
 * Deletes an alert for an application.
 * Requires authentication and authorization.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const deleteAlert = async (req, res, next) => {
  try {
    const { alertId } = req.params; // Expect alertId from URL params
    await metricService.deleteAlert(alertId);
    res.status(204).json({
      status: 'success',
      data: null,
      message: 'Alert deleted successfully.',
    });
  } catch (error) {
    logger.error(`Error deleting alert ${req.params.alertId}:`, error.message);
    next(error);
  }
};


module.exports = {
  collectMetric,
  getMetrics,
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
};
```