```javascript
const express = require('express');
const taskController = require('../controllers/taskController');
const auth = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth(), taskController.createTask)
  .get(auth(), taskController.getTasks);

router
  .route('/:taskId')
  .get(auth(), taskController.getTask)
  .patch(auth(), taskController.updateTask)
  .delete(auth(), taskController.deleteTask);

module.exports = router;
```