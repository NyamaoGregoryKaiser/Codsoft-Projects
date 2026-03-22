```javascript
const express = require('express');
const { auth, isOwnerOrAdmin } = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const taskValidation = require('../../validations/task.validation');
const taskController = require('../../controllers/task.controller');
const { invalidateCache, cacheMiddleware } = require('../../middlewares/cache');

const router = express = require('express');

const router = express.Router();

router
  .route('/')
  .post(auth('USER', 'ADMIN'), invalidateCache('tasks:project'), validate(taskValidation.createTask), taskController.createTask)
  .get(auth('USER', 'ADMIN'), cacheMiddleware('tasks', 30), taskController.getTasks); // Cache tasks list for 30 seconds

router
  .route('/:taskId')
  .get(auth('USER', 'ADMIN'), validate(taskValidation.getTask), taskController.getTask)
  .patch(auth('USER', 'ADMIN'), isOwnerOrAdmin('task', 'taskId'), invalidateCache('tasks:project'), validate(taskValidation.updateTask), taskController.updateTask) // invalidateCache needs projectId, so we'll invalidate broader 'tasks:project'
  .delete(auth('USER', 'ADMIN'), isOwnerOrAdmin('task', 'taskId'), invalidateCache('tasks:project'), validate(taskValidation.deleteTask), taskController.deleteTask);

module.exports = router;
```