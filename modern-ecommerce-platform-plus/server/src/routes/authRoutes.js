```javascript
// server/src/routes/authRoutes.js
const express = require('express');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimitMiddleware');
const { validate, authValidation } = require('../utils/validators');

const router = express.Router();

router.post('/register', validate(authValidation.register), authLimiter, authController.register);
router.post('/login', validate(authValidation.login), authLimiter, authController.login);
router.get('/profile', auth, authController.getProfile);
router.put('/profile', auth, authController.updateProfile);

module.exports = router;

```