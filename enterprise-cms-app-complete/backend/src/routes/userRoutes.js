const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Only Admins can manage all users
router.get('/', authenticate, authorize(['admin']), userController.getAllUsers);
router.get('/:id', authenticate, authorize(['admin', 'editor', 'author']), userController.getUserById); // Editors/Authors can view user profiles, potentially restricted later
router.put('/:id', authenticate, authorize(['admin', 'editor', 'author', 'subscriber']), userController.updateUser); // User can update self, Admin/Editor can update others
router.delete('/:id', authenticate, authorize(['admin']), userController.deleteUser);

module.exports = router;