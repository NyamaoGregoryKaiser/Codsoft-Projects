```javascript
const httpStatus = require('http-status');
const { alertService } = require('../services');
const catchAsync = require('../utils/catchAsync');

const createAlert = catchAsync(async (req, res) => {
  const alert = await alertService.createAlert(req.params.projectId, req.body);
  res.status(httpStatus.CREATED).send(alert);
});

const getAlerts = catchAsync(async (req, res) => {
  // Ensure user owns project through project_id check
  const alerts = await alertService.getAlerts(req.params.projectId, req.user.id);
  res.send(alerts);
});

const getAlert = catchAsync(async (req, res) => {
  const alert = await alertService.getAlertById(req.params.alertId, req.params.projectId, req.user.id);
  res.send(alert);
});

const updateAlert = catchAsync(async (req, res) => {
  const alert = await alertService.updateAlert(req.params.alertId, req.params.projectId, req.user.id, req.body);
  res.send(alert);
});

const deleteAlert = catchAsync(async (req, res) => {
  await alertService.deleteAlert(req.params.alertId, req.params.projectId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const getAlertIncidents = catchAsync(async (req, res) => {
  const incidents = await alertService.getAlertIncidents(req.params.projectId, req.user.id, req.query);
  res.send(incidents);
});

const updateAlertIncidentStatus = catchAsync(async (req, res) => {
  const { status } = req.body;
  const incident = await alertService.updateAlertIncidentStatus(req.params.incidentId, req.params.projectId, req.user.id, status);
  res.send(incident);
});

module.exports = {
  createAlert,
  getAlerts,
  getAlert,
  updateAlert,
  deleteAlert,
  getAlertIncidents,
  updateAlertIncidentStatus,
};
```