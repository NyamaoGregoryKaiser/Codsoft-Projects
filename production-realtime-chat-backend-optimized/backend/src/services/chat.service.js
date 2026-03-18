```javascript
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { ChatRoom, User, Message } = require('../models');
const { Op } = require('sequelize');

/**
 * Create a chat room
 * @param {Object} chatRoomBody
 * @param {UUID} userId - Creator's ID
 * @returns {Promise<ChatRoom>}
 */
const createChatRoom = async (chatRoomBody, userId) => {
  if (await ChatRoom.findOne({ where: { name: chatRoomBody.name } })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Chat room with this name already exists');
  }
  const chatRoom = await ChatRoom.create(chatRoomBody);
  const user = await User.findByPk(userId);
  if (user) {
    await chatRoom.addUser(user); // Add creator to the room
  }
  return chatRoom;
};

/**
 * Get all chat rooms
 * @returns {Promise<ChatRoom[]>}
 */
const getAllChatRooms = async () => {
  return ChatRoom.findAll({
    include: [{
      model: User,
      as: 'users',
      attributes: ['id', 'username']
    }],
  });
};

/**
 * Get chat room by ID
 * @param {UUID} roomId
 * @returns {Promise<ChatRoom>}
 */
const getChatRoomById = async (roomId) => {
  const room = await ChatRoom.findByPk(roomId, {
    include: [{
      model: User,
      as: 'users',
      attributes: ['id', 'username', 'email']
    }],
  });
  if (!room) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Chat room not found');
  }
  return room;
};

/**
 * Get messages for a chat room
 * @param {UUID} roomId
 * @param {Object} options - Query options for messages
 * @param {number} [options.limit=50] - Number of messages to retrieve
 * @param {number} [options.offset=0] - Offset for pagination
 * @returns {Promise<Message[]>}
 */
const getRoomMessages = async (roomId, options = { limit: 50, offset: 0 }) => {
  const messages = await Message.findAll({
    where: { chatRoomId: roomId },
    include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }],
    order: [['createdAt', 'ASC']],
    limit: options.limit,
    offset: options.offset,
  });
  return messages;
};

/**
 * Add user to a chat room
 * @param {UUID} roomId
 * @param {UUID} userId
 * @returns {Promise<ChatRoom>}
 */
const addUserToRoom = async (roomId, userId) => {
  const chatRoom = await getChatRoomById(roomId);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user is already in the room
  const isMember = await chatRoom.hasUser(user);
  if (isMember) {
    return chatRoom; // User is already a member, no action needed
  }

  await chatRoom.addUser(user);
  return chatRoom;
};

/**
 * Remove user from a chat room
 * @param {UUID} roomId
 * @param {UUID} userId
 * @returns {Promise<ChatRoom>}
 */
const removeUserFromRoom = async (roomId, userId) => {
  const chatRoom = await getChatRoomById(roomId);
  const user = await User.findByPk(userId);

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  await chatRoom.removeUser(user);
  return chatRoom;
};

/**
 * Delete a chat room
 * @param {UUID} roomId
 * @returns {Promise<void>}
 */
const deleteChatRoom = async (roomId) => {
  const chatRoom = await getChatRoomById(roomId);
  await chatRoom.destroy();
};

/**
 * Save a new message
 * @param {UUID} chatRoomId
 * @param {UUID} userId
 * @param {string} content
 * @returns {Promise<Message>}
 */
const saveMessage = async (chatRoomId, userId, content) => {
  const message = await Message.create({ chatRoomId, userId, content });
  return message.reload({ include: [{ model: User, as: 'sender', attributes: ['id', 'username'] }] }); // Reload with sender info
};

module.exports = {
  createChatRoom,
  getAllChatRooms,
  getChatRoomById,
  getRoomMessages,
  addUserToRoom,
  removeUserFromRoom,
  deleteChatRoom,
  saveMessage,
};
```