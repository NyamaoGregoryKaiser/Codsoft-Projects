const express = require('express');
const auth = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const userValidation = require('../utils/validationSchemas');
const userController = require('../controllers/user.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(userValidation.createUser), userController.createUser)
  .get(auth('admin', 'editor'), userController.getUsers); // Admin and Editor can view users

router
  .route('/:userId')
  .get(auth('admin', 'editor'), userController.getUser) // Admin and Editor can view user profile
  .patch(auth('admin'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('admin'), userController.deleteUser);

module.exports = router;