```javascript
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/project.controller');
const taskController = require('../controllers/task.controller'); // Nested tasks routes
const authMiddleware = require('../middleware/auth.middleware');

// Project routes (protected)
router.use(authMiddleware.protect);

router.route('/')
  .post(projectController.createProject)
  .get(projectController.getAllProjects);

router.route('/:id')
  .get(projectController.getProjectById)
  .put(projectController.updateProject)
  .delete(projectController.deleteProject);

// Nested routes for tasks within a project
router.route('/:projectId/tasks')
  .post(taskController.createTask); // Only project owner/admin can create tasks

router.route('/:projectId/tasks/:taskId')
  .get(taskController.getTaskById)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

module.exports = router;
```