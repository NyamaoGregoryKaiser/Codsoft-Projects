```javascript
const express = require('express');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');

const router = express.Router();

router
  .route('/')
  .post(auth(), commentController.createComment);

router
  .route('/:taskId/task')
  .get(auth(), commentController.getCommentsByTask); // Get comments for a specific task

router
  .route('/:commentId')
  .patch(auth(), commentController.updateComment)
  .delete(auth(), commentController.deleteComment);

module.exports = router;
```