```javascript
const express = require('express');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', auth(), authController.logout);
router.post('/refresh-tokens', authController.refreshTokens); // Placeholder

module.exports = router;
```