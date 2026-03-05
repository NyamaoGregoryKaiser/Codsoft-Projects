const express = require('express');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Admin-only routes
router.route('/')
  .get(authorize('admin'), getUsers); // Get all users (admin only)

router.route('/:id')
  .get(authorize(['admin', 'user']), getUserById) // Users can view their own profile, admin can view any
  .put(authorize(['admin', 'user']), updateUser)   // Users can update their own profile, admin can update any
  .delete(authorize('admin'), deleteUser); // Delete user (admin only)

module.exports = router;