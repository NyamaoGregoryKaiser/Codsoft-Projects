```javascript
const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
// authorizeRoles('admin') is applied in the controller array for each route
// Or it can be applied directly here: router.use(authorizeRoles('admin')); for all routes in this file.

router.route('/')
  .get(getUsers); // Admin only

router.route('/:id')
  .get(getUserById) // Admin only
  .put(updateUser) // Admin only
  .delete(deleteUser); // Admin only

module.exports = router;
```