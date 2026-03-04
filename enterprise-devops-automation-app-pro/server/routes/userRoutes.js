const express = require('express');
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Routes for administrators only
router.use(protect); // All routes below this require authentication
router.use(authorize('admin')); // All routes below this require 'admin' role

router.route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser); // Admin can create users

router.route('/:id')
  .get(userController.getUserById)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;