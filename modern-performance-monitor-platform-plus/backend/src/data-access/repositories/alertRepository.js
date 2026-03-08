```javascript
const db = require('../db');

const ALERTS_TABLE = 'alerts';
const ALERT_INCIDENTS_TABLE = 'alert_incidents';

// --- Alerts ---
const createAlert = async (alert) => {
  const [newAlert] = await db(ALERTS_TABLE).insert(alert).returning('*');
  return newAlert;
};

const getAlertsByProjectId = async (projectId) => {
  return db(ALERTS_TABLE).where({ project_id: projectId }).orderBy('created_at', 'desc');
};

const getAlertById = async (id) => {
  return db(ALERTS_TABLE).where({ id }).first();
};

const updateAlert = async (id, updates) => {
  const [updatedAlert] = await db(ALERTS_TABLE).where({ id }).update(updates).returning('*');
  return updatedAlert;
};

const deleteAlert = async (id) => {
  await db(ALERTS_TABLE).where({ id }).del();
  return true;
};

// --- Alert Incidents ---
const createAlertIncident = async (incident) => {
  const [newIncident] = await db(ALERT_INCIDENTS_TABLE).insert(incident).returning('*');
  return newIncident;
};

const getAlertIncidentsByProjectId = async (projectId, status, limit = 100, offset = 0) => {
  const query = db(ALERT_INCIDENTS_TABLE)
    .where({ project_id: projectId })
    .orderBy('triggered_at', 'desc')
    .limit(limit)
    .offset(offset);

  if (status) {
    query.andWhere({ status });
  }
  return query;
};

const getAlertIncidentById = async (id) => {
  return db(ALERT_INCIDENTS_TABLE).where({ id }).first();
};

const updateAlertIncident = async (id, updates) => {
  const [updatedIncident] = await db(ALERT_INCIDENTS_TABLE).where({ id }).update(updates).returning('*');
  return updatedIncident;
};

module.exports = {
  createAlert,
  getAlertsByProjectId,
  getAlertById,
  updateAlert,
  deleteAlert,
  createAlertIncident,
  getAlertIncidentsByProjectId,
  getAlertIncidentById,
  updateAlertIncident,
};
```