```javascript
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { cacheMiddleware } = require('../utils/cache');

const router = express.Router();

// All user management routes require authentication and admin role
router.use(authenticate);
router.use(authorize(['admin'])); // Only admins can manage users

// GET /api/users - Get all users (cached for 1 hour)
router.get('/', cacheMiddleware(3600), userController.getAllUsers);

// GET /api/users/:id - Get a single user by ID (cached for 1 hour)
router.get('/:id', cacheMiddleware(3600), userController.getUserById);

// PUT /api/users/:id - Update a user by ID
router.put('/:id', userController.updateUser);

// DELETE /api/users/:id - Delete a user by ID
router.delete('/:id', userController.deleteUser);

module.exports = router;
```