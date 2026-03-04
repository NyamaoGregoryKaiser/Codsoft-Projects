const express = require('express');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/logout', protect, authController.logout); // Logout requires authentication
router.get('/me', protect, authController.getMe); // Get current user info

module.exports = router;