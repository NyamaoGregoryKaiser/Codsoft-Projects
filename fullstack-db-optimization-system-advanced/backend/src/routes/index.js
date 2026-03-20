const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const metricRoutes = require('./metricRoutes');
const queryRoutes = require('./queryRoutes');
const indexRoutes = require('./indexRoutes');
const schemaRoutes = require('./schemaRoutes');

router.use('/auth', authRoutes);
router.use('/metrics', metricRoutes);
router.use('/queries', queryRoutes);
router.use('/indexes', indexRoutes);
router.use('/schemas', schemaRoutes);

// Simple health check route
router.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

module.exports = router;