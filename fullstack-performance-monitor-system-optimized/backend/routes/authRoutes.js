```javascript
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authRateLimiter } = require('../middleware/rateLimitMiddleware');

// Apply authRateLimiter to login and register routes to prevent brute-force attacks
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);

module.exports = router;
```