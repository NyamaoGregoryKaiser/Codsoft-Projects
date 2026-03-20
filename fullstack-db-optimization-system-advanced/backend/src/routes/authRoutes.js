const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe } = require('@controllers/authController');
const { protect } = require('@middleware/authMiddleware');
const { authRateLimiter } = require('@middleware/rateLimitMiddleware');

router.post('/register', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.get('/me', protect, getMe);

module.exports = router;