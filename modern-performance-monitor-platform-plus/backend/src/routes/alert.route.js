```javascript
const express = require('express');
const alertController = require('../controllers/alertController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

const projectIdParamSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
};

const alertIdParamSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
    alertId: Joi.string().uuid().required(),
  }),
};

const incidentIdParamSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
    incidentId: Joi.string().uuid().required(),
  }),
};

const createAlertSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string().required(),
    metricType: Joi.string().required(),
    aggregationType: Joi.string().valid('avg', 'sum', 'count', 'max', 'min').required(),
    field: Joi.string().required(),
    operator: Joi.string().valid('>', '<', '=').required(),
    threshold: Joi.number().required(),
    timeWindowMinutes: Joi.number().integer().min(1).required(),
    isEnabled: Joi.boolean().default(true),
  }),
};

const updateAlertSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
    alertId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    name: Joi.string(),
    metricType: Joi.string(),
    aggregationType: Joi.string().valid('avg', 'sum', 'count', 'max', 'min'),
    field: Joi.string(),
    operator: Joi.string().valid('>', '<', '='),
    threshold: Joi.number(),
    timeWindowMinutes: Joi.number().integer().min(1),
    isEnabled: Joi.boolean(),
  }).min(1),
};

const getAlertIncidentsSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
  }),
  query: Joi.object().keys({
    status: Joi.string().valid('triggered', 'resolved', 'acknowledged'),
    limit: Joi.number().integer().min(1).max(1000).default(100),
    offset: Joi.number().integer().min(0).default(0),
  }),
};

const updateAlertIncidentStatusSchema = {
  params: Joi.object().keys({
    projectId: Joi.string().uuid().required(),
    incidentId: Joi.string().uuid().required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('resolved', 'acknowledged').required(),
  }),
};

// Alert routes
router
  .route('/:projectId/alerts')
  .post(auth(), validate(createAlertSchema), alertController.createAlert)
  .get(auth(), validate(projectIdParamSchema), alertController.getAlerts);

router
  .route('/:projectId/alerts/:alertId')
  .get(auth(), validate(alertIdParamSchema), alertController.getAlert)
  .patch(auth(), validate(updateAlertSchema), alertController.updateAlert)
  .delete(auth(), validate(alertIdParamSchema), alertController.deleteAlert);

// Alert Incidents routes
router
  .route('/:projectId/incidents')
  .get(auth(), validate(getAlertIncidentsSchema), alertController.getAlertIncidents);

router
  .route('/:projectId/incidents/:incidentId/status')
  .patch(auth(), validate(updateAlertIncidentStatusSchema), alertController.updateAlertIncidentStatus);


module.exports = router;
```