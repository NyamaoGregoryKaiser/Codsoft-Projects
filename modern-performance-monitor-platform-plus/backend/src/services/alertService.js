```javascript
const { v4: uuidv4 } = require('uuid');
const { alertRepository } = require('../data-access/repositories');
const httpStatus = require('http-status');
const { ApiError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const createAlert = async (projectId, alertBody) => {
  const newAlert = {
    id: uuidv4(),
    project_id: projectId,
    ...alertBody,
  };
  const alert = await alertRepository.createAlert(newAlert);
  logger.info(`Alert created for project ${projectId}: ${alert.name}`);
  return alert;
};

const getAlerts = async (projectId, userId) => {
  // Assuming a check ensuring userId owns projectId is done in controller
  const alerts = await alertRepository.getAlertsByProjectId(projectId);
  return alerts;
};

const getAlertById = async (alertId, projectId, userId) => {
  const alert = await alertRepository.getAlertById(alertId);
  if (!alert || alert.project_id !== projectId) { // Further check if project belongs to user (implicit)
    throw new ApiError('Alert not found or unauthorized', httpStatus.NOT_FOUND);
  }
  return alert;
};

const updateAlert = async (alertId, projectId, userId, updateBody) => {
  const alert = await getAlertById(alertId, projectId, userId); // Ensures user owns alert
  const updatedAlert = await alertRepository.updateAlert(alertId, updateBody);
  logger.info(`Alert updated for project ${projectId}: ${alert.name}`);
  return updatedAlert;
};

const deleteAlert = async (alertId, projectId, userId) => {
  const alert = await getAlertById(alertId, projectId, userId); // Ensures user owns alert
  await alertRepository.deleteAlert(alertId);
  logger.info(`Alert deleted for project ${projectId}: ${alert.name}`);
  return { message: 'Alert deleted successfully' };
};

// Alert Incident Operations
const getAlertIncidents = async (projectId, userId, queryParams) => {
  const { status, limit, offset } = queryParams;
  // Assuming a check ensuring userId owns projectId is done in controller
  const incidents = await alertRepository.getAlertIncidentsByProjectId(
    projectId,
    status,
    parseInt(limit, 10) || 100,
    parseInt(offset, 10) || 0
  );
  return incidents;
};

const updateAlertIncidentStatus = async (incidentId, projectId, userId, newStatus) => {
  const incident = await alertRepository.getAlertIncidentById(incidentId);
  if (!incident || incident.project_id !== projectId) {
    throw new ApiError('Alert incident not found or unauthorized', httpStatus.NOT_FOUND);
  }

  // Basic status validation
  const validStatuses = ['triggered', 'resolved', 'acknowledged'];
  if (!validStatuses.includes(newStatus)) {
    throw new ApiError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, httpStatus.BAD_REQUEST);
  }

  const updates = { status: newStatus };
  if (newStatus === 'resolved' && !incident.resolved_at) {
    updates.resolved_at = new Date().toISOString();
  } else if (newStatus === 'triggered' && incident.resolved_at) { // Re-triggering resolved alert
    updates.resolved_at = null;
  }

  const updatedIncident = await alertRepository.updateAlertIncident(incidentId, updates);
  logger.info(`Alert incident ${incidentId} status updated to ${newStatus} for project ${projectId}`);
  return updatedIncident;
};

module.exports = {
  createAlert,
  getAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  getAlertIncidents,
  updateAlertIncidentStatus,
};
```