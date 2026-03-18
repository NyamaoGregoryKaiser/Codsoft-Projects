```javascript
const express = require('express');
const auth = require('../../middleware/auth');
const userController = require('../../controllers/user.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), userController.createUser) // Only admin can create users via API
  .get(auth('admin'), userController.getUsers); // Only admin can list all users

router
  .route('/:userId')
  .get(auth(), userController.getUser) // Any logged-in user can get their own profile, admin can get any
  .patch(auth(), userController.updateUser) // Users can update their own, admin can update any
  .delete(auth('admin'), userController.deleteUser); // Only admin can delete users

module.exports = router;
```