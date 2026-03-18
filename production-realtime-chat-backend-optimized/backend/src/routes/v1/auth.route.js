```javascript
const express = require('express');
const authController = require('../../controllers/auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh-tokens', authController.refreshTokens);

module.exports = router;
```