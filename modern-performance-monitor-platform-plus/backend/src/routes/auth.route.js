```javascript
const express = require('express');
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const validate = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

const registerSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
    firstName: Joi.string(),
    lastName: Joi.string(),
  }),
};

const loginSchema = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout); // Logout doesn't need auth, destroys session
router.get('/me', auth(), authController.getCurrentUser); // Get current authenticated user

module.exports = router;
```