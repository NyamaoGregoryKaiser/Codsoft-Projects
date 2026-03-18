```javascript
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { chatService, userService } = require('../services');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const createChatRoom = catchAsync(async (req, res) => {
  const chatRoom = await chatService.createChatRoom(req.body, req.user.id);
  res.status(httpStatus.CREATED).send(new ApiResponse(httpStatus.CREATED, 'Chat room created', chatRoom));
});

const getChatRooms = catchAsync(async (req, res) => {
  const chatRooms = await chatService.getAllChatRooms();
  res.send(new ApiResponse(httpStatus.OK, 'Chat rooms retrieved', chatRooms));
});

const getChatRoom = catchAsync(async (req, res) => {
  const chatRoom = await chatService.getChatRoomById(req.params.roomId);
  // Optional: Check if the requesting user is a member of a private room
  if (chatRoom.isPrivate) {
    const isMember = chatRoom.users.some(user => user.id === req.user.id);
    if (!isMember && req.user.role !== 'admin') {
      throw new ApiError(httpStatus.FORBIDDEN, 'Access to private room denied');
    }
  }
  res.send(new ApiResponse(httpStatus.OK, 'Chat room retrieved', chatRoom));
});

const getChatRoomMessages = catchAsync(async (req, res) => {
  const { roomId } = req.params;
  const { limit = 50, offset = 0 } = req.query;

  // First, verify user has access to the room
  const chatRoom = await chatService.getChatRoomById(roomId);
  const isMember = chatRoom.users.some(user => user.id === req.user.id);

  if (!isMember && chatRoom.isPrivate && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access to private room denied');
  }

  const messages = await chatService.getRoomMessages(roomId, { limit: parseInt(limit), offset: parseInt(offset) });
  res.send(new ApiResponse(httpStatus.OK, 'Messages retrieved', messages));
});

const joinChatRoom = catchAsync(async (req, res) => {
  const chatRoom = await chatService.addUserToRoom(req.params.roomId, req.user.id);
  res.send(new ApiResponse(httpStatus.OK, 'Joined chat room', chatRoom));
});

const leaveChatRoom = catchAsync(async (req, res) => {
  await chatService.removeUserFromRoom(req.params.roomId, req.user.id);
  res.status(httpStatus.NO_CONTENT).send();
});

const deleteChatRoom = catchAsync(async (req, res) => {
  await chatService.deleteChatRoom(req.params.roomId);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  createChatRoom,
  getChatRooms,
  getChatRoom,
  getChatRoomMessages,
  joinChatRoom,
  leaveChatRoom,
  deleteChatRoom,
};
```