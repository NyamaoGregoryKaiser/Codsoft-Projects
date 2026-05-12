```javascript
const express = require('express');
const validate = require('../../utils/joiValidation');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const { authLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);
router.post('/refresh-tokens', authLimiter, authController.refreshTokens);
router.post('/logout', authController.logout); // Logout is typically client-side token discard for JWT

module.exports = router;
```