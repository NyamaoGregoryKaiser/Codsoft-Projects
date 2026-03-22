```javascript
const express = require('express');
const validate = require('../../middlewares/validate');
const authValidation = require('../../validations/auth.validation');
const authController = require('../../controllers/auth.controller');
const authLimiter = require('../../middlewares/rateLimiter');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', authLimiter, validate(authValidation.login), authController.login);

module.exports = router;
```