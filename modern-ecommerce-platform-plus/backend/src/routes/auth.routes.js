const express = require('express');
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const authValidation = require('../utils/validation/auth.validation');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

module.exports = router;