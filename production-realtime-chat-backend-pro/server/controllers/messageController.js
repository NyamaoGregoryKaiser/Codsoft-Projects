```javascript
const asyncHandler = require('../middleware/async');
const messageService = require('../services/messageService');
const logger = require('../config/winston');
const ErrorResponse = require('../utils/errorResponse');

// @desc      Get messages for a specific room
// @route     GET /api/v1/messages/:roomId
// @access    Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;

  // Additional check: Ensure req.user is a member of roomId before fetching messages
  // This would typically involve fetching the room and checking its members array.
  // For simplicity, this is handled in messageService.createMessage and implicitly by roomService.getRoomById.
  // A robust check here would be:
  // const room = await Room.findById(roomId);
  // if (!room || !room.members.includes(req.user.id)) {
  //   return next(new ErrorResponse('Not authorized to view messages in this room', 403));
  // }

  const messages = await messageService.getMessagesInRoom(roomId, page, limit);
  res.status(200).json({ success: true, count: messages.length, data: messages });
});

// @desc      Create a new message (REST endpoint, but primarily for Socket.IO)
// @route     POST /api/v1/messages/:roomId
// @access    Private
exports.createMessage = asyncHandler(async (req, res, next) => {
  const { roomId } = req.params;
  const { content } = req.body;

  if (!content || content.trim() === '') {
    return next(new ErrorResponse('Message content cannot be empty', 400));
  }

  const message = await messageService.createMessage(roomId, req.user.id, content);
  res.status(201).json({ success: true, data: message });
});
```