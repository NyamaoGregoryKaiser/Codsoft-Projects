```javascript
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller'); // Assuming a user controller for admin features
const authMiddleware = require('../middleware/auth.middleware');

// Example admin-only route: get all users
// In a full application, this would be more complex
router.get('/', authMiddleware.protect, authMiddleware.authorize('admin'), userController.getAllUsers);

module.exports = router;
```