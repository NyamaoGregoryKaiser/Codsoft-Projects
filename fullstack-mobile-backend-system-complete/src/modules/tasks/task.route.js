```javascript
const express = require('express');
const { authenticate, authorize } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validate.middleware');
const { cache, invalidateCache } = require('../../middleware/cache.middleware');
const taskValidation = require('./task.validation');
const taskController = require('./task.controller');

const router = express.Router({ mergeParams: true }); // `mergeParams: true` to access `projectId` from parent route

router
  .route('/')
  .post(
    authenticate,
    authorize(['USER', 'ADMIN']),
    validate(taskValidation.createTask),
    invalidateCache('tasks:*:project:*'), // Invalidate all tasks cache for this project, and any tasks list
    taskController.createTask
  )
  .get(
    authenticate,
    authorize(['USER', 'ADMIN']),
    cache('tasks', 300), // Cache tasks list for 5 minutes
    validate(taskValidation.getTasks),
    taskController.getTasks
  );

router
  .route('/:taskId')
  .get(
    authenticate,
    authorize(['USER', 'ADMIN']),
    cache('task', 300), // Cache individual task for 5 minutes
    validate(taskValidation.getTask),
    taskController.getTask
  )
  .patch(
    authenticate,
    authorize(['USER', 'ADMIN']),
    validate(taskValidation.updateTask),
    invalidateCache(['tasks:*:project:*', 'task:*:id']), // Invalidate tasks list and specific task cache
    taskController.updateTask
  )
  .delete(
    authenticate,
    authorize(['USER', 'ADMIN']),
    validate(taskValidation.deleteTask),
    invalidateCache(['tasks:*:project:*', 'task:*:id']), // Invalidate tasks list and specific task cache
    taskController.deleteTask
  );

module.exports = router;
```