const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/profile', authenticate, AuthController.getProfile); // Protected route example

module.exports = router;