```javascript
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Task routes can also be directly accessed (e.g., if you want to get a task without knowing its project)
// However, the existing project-nested routes are often more intuitive.
// This file can be used for global task search/management routes (e.g., /api/v1/tasks?assignee=X)
// For simplicity, we mostly rely on nested routes, but this demonstrates the structure.

router.use(authMiddleware.protect); // All task routes require authentication

// This route might allow filtering tasks across all projects for an admin or assignee
// For this example, we'll keep it simple and mostly rely on project-nested tasks.
// Example: router.get('/', taskController.getAllTasks);

module.exports = router;
```