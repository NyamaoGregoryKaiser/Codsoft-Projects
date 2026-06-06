```javascript
const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { cache, invalidateCache } = require('../../middleware/cache.middleware');
const userValidation = require('./user.validation');
const userController = require('./user.controller');

const router = express.Router();

router
  .route('/')
  .post(
    authenticate,
    authorize(['ADMIN']), // Only admin can create users via this route
    validate(userValidation.createUser),
    invalidateCache('users:*'), // Invalidate cache for all user lists
    userController.createUser
  )
  .get(
    authenticate,
    authorize(['ADMIN']), // Only admin can get all users
    cache('users', 300), // Cache user lists for 5 minutes
    validate(userValidation.getUsers),
    userController.getUsers
  );

router
  .route('/:userId')
  .get(
    authenticate,
    authorize(['USER', 'ADMIN']), // User can get their own profile, admin can get any
    cache('user', 60), // Cache individual user for 1 minute
    validate(userValidation.getUser),
    userController.getUser
  )
  .patch(
    authenticate,
    authorize(['USER', 'ADMIN']), // User can update their own profile, admin can update any
    validate(userValidation.updateUser),
    invalidateCache(['users:*', 'user:*:id']), // Invalidate list and specific user cache
    userController.updateUser
  )
  .delete(
    authenticate,
    authorize(['ADMIN']), // Only admin can delete users
    validate(userValidation.deleteUser),
    invalidateCache(['users:*', 'user:*:id']), // Invalidate list and specific user cache
    userController.deleteUser
  );

module.exports = router;
```