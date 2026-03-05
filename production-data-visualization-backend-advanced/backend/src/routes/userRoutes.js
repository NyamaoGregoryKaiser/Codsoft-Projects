const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { cacheMiddleware, clearCache } = require('../middleware/cachingMiddleware');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// Only admin can access all users
router.route('/')
  .get(authorize('admin'), cacheMiddleware, userController.getAllUsers);

// Admin can manage any user, regular users can view/update their own profile
router.route('/:id')
  .get(userController.getUser) // Authorization for self-profile or admin check can be added in controller
  .put(clearCache, userController.updateUser) // Authorization for self-profile or admin check can be added in controller
  .delete(authorize('admin'), clearCache, userController.deleteUser); // Only admin can delete users

module.exports = router;