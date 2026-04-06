const express = require('express');
const DbConnectionController = require('../controllers/dbConnection.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes here require authentication
router.use(authenticate);

router.post('/', DbConnectionController.createConnection);
router.get('/', DbConnectionController.getAllConnections);
router.get('/:id', DbConnectionController.getConnectionById);
router.put('/:id', DbConnectionController.updateConnection);
router.delete('/:id', DbConnectionController.deleteConnection);

router.post('/:id/monitor/start', DbConnectionController.startMonitoring);
router.post('/:id/monitor/stop', DbConnectionController.stopMonitoring);

module.exports = router;