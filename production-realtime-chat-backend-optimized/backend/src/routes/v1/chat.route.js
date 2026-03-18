```javascript
const express = require('express');
const auth = require('../../middleware/auth');
const chatController = require('../../controllers/chat.controller');

const router = express.Router();

router
  .route('/')
  .post(auth(), chatController.createChatRoom)
  .get(auth(), chatController.getChatRooms);

router
  .route('/:roomId')
  .get(auth(), chatController.getChatRoom)
  .delete(auth('admin'), chatController.deleteChatRoom); // Only admin can delete rooms

router.get('/:roomId/messages', auth(), chatController.getChatRoomMessages);
router.post('/:roomId/join', auth(), chatController.joinChatRoom);
router.post('/:roomId/leave', auth(), chatController.leaveChatRoom);

module.exports = router;
```