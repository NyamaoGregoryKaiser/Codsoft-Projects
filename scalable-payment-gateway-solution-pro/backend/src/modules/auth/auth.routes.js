const express = require('express');
const validate = require('../../middleware/validate.middleware'); // (Simplified: assumes a Joi validation middleware)
const authController = require('./auth.controller');
const authValidation = require('./auth.validation');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens); // (Not fully implemented, placeholder)

module.exports = router;