```javascript
const express = require('express');
const { getMessages, createMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All message routes are protected
router.use(protect);

router.route('/:roomId')
  .get(getMessages)
  .post(createMessage); // Note: Messages are primarily sent via Socket.IO, this is an alternative/fallback

module.exports = router;
```