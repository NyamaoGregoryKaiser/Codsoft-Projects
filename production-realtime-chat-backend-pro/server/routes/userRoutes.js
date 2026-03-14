```javascript
const express = require('express');
const { getUsers, getUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All user routes are protected
router.use(protect);

router.route('/')
  .get(getUsers);

router.route('/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser); // Consider adding authorize('admin') here

module.exports = router;
```