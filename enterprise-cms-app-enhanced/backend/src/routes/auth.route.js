const express = require('express');
const validate = require('../middlewares/validate.middleware');
const authValidation = require('../utils/validationSchemas');
const authController = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);
router.post('/login', validate(authValidation.login), authController.login);
router.post('/logout', auth(), authController.logout); // Requires authentication to logout, invalidates token (conceptually)
// router.post('/refresh-tokens', validate(authValidation.refreshTokens), authController.refreshTokens);

module.exports = router;