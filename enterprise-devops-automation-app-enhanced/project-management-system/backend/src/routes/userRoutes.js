```javascript
const express = require('express');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth('admin'), userController.createUser) // Only admin can create users directly
  .get(auth('admin'), userController.getUsers); // Only admin can list all users

router
  .route('/:userId')
  .get(auth('admin'), userController.getUser) // Only admin can get any user
  .patch(auth('admin'), userController.updateUser) // Only admin can update any user
  .delete(auth('admin'), userController.deleteUser); // Only admin can delete users

module.exports = router;
```