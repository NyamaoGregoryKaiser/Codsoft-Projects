```javascript
const express = require('express');
const auth = require('../../middlewares/auth').auth;
const isOwnerOrAdmin = require('../../middlewares/auth').isOwnerOrAdmin;
const validate = require('../../middlewares/validate');
const userValidation = require('../../validations/user.validation');
const userController = require('../../controllers/user.controller');
const { cacheMiddleware, invalidateCache } = require('../../middlewares/cache');

const router = express.Router();

router
  .route('/')
  .post(auth('ADMIN'), invalidateCache('users'), validate(userValidation.createUser), userController.createUser)
  .get(auth('ADMIN'), cacheMiddleware('users', 300), userController.getUsers); // Cache user list for 5 minutes

router
  .route('/:userId')
  .get(auth('ADMIN', 'USER'), validate(userValidation.getUser), userController.getUser) // Admin can get any user. Regular user can't use this route normally (only for admin), will use /profile
  .patch(auth('ADMIN'), invalidateCache('users'), validate(userValidation.updateUser), userController.updateUser)
  .delete(auth('ADMIN'), invalidateCache('users'), validate(userValidation.deleteUser), userController.deleteUser);

router
  .route('/profile')
  .get(auth('USER', 'ADMIN'), userController.getMyProfile)
  .patch(auth('USER', 'ADMIN'), invalidateCache('users'), validate(userValidation.updateUser), userController.updateMyProfile); // Users can update their own profile

module.exports = router;
```