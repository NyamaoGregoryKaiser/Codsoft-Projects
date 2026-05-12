```javascript
const express = require('express');
const validate = require('../../utils/joiValidation');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const auth = require('../../middleware/auth');
const { clearCache } = require('../../middleware/cache'); // Import clear cache utility

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), validate(userValidation.createUser), clearCache, userController.createUser)
  .get(auth('admin'), validate(userValidation.getUsers), userController.getUsers);

router
  .route('/:userId')
  .get(auth('admin'), validate(userValidation.getUser), userController.getUser)
  .patch(auth('admin'), validate(userValidation.updateUser), clearCache, userController.updateUser)
  .delete(auth('admin'), validate(userValidation.deleteUser), clearCache, userController.deleteUser);

module.exports = router;
```