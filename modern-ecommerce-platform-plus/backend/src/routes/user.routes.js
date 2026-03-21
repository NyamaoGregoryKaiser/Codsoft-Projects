const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const logger = require('../utils/logger');
// In a real app, you'd have a user.service.js and user.controller.js
// For now, this is a placeholder to show protected routes.

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  // Return current user's profile
  res.status(200).json({
    status: 'success',
    data: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

router.get('/admin-data', authenticate, authorize('admin'), (req, res) => {
  // Only accessible by admin users
  res.status(200).json({
    status: 'success',
    message: `Welcome, Admin ${req.user.name}! This is confidential admin data.`,
    data: {
      adminId: req.user.id,
      adminEmail: req.user.email,
    },
  });
});

router.put('/:id', authenticate, async (req, res) => {
  // Example for updating user profile.
  // In a real app, you'd use a controller and service here.
  if (req.user.id !== parseInt(req.params.id, 10) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
  }

  // Logic to update user in DB
  logger.info(`User ${req.user.id} updated profile for user ${req.params.id}`);
  res.status(200).json({ status: 'success', message: 'User updated (mocked)' });
});

module.exports = router;