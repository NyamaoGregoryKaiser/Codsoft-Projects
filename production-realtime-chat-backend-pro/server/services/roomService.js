```javascript
const Room = require('../models/Room');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const logger = require('../config/winston');

/**
 * Get all rooms a user is a member of.
 * @param {string} userId - The ID of the user.
 * @returns {Array<Room>} List of rooms.
 */
exports.getRoomsForUser = async (userId) => {
  const rooms = await Room.find({ members: userId }).populate({
    path: 'members',
    select: 'username email'
  });
  logger.debug(`Fetched rooms for user ${userId}`);
  return rooms;
};

/**
 * Get a single room by ID.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user requesting the room (for authorization).
 * @returns {Room} The room object.
 * @throws {ErrorResponse} If room not found or user not authorized.
 */
exports.getRoomById = async (roomId, userId) => {
  const room = await Room.findById(roomId).populate({
    path: 'members',
    select: 'username email'
  });

  if (!room) {
    logger.warn(`Room not found with ID: ${roomId}`);
    throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  }

  // Check if user is a member of a private room
  if (room.isPrivate && !room.members.some(member => member._id.toString() === userId)) {
    logger.warn(`User ${userId} attempted to access private room ${roomId} without membership.`);
    throw new ErrorResponse('Not authorized to access this private room', 403);
  }

  logger.debug(`Fetched room by ID: ${roomId}`);
  return room;
};

/**
 * Create a new room.
 * @param {string} name - Name of the room.
 * @param {boolean} isPrivate - Whether the room is private.
 * @param {Array<string>} memberIds - Initial member IDs.
 * @param {string} creatorId - The ID of the user creating the room.
 * @returns {Room} The created room object.
 * @throws {ErrorResponse} If validation fails or members are invalid.
 */
exports.createRoom = async (name, isPrivate, memberIds = [], creatorId) => {
  const members = new Set([creatorId, ...memberIds]); // Ensure creator is a member

  const existingRoom = await Room.findOne({ name });
  if (existingRoom) {
    logger.warn(`Attempted to create room with existing name: ${name}`);
    throw new ErrorResponse('Room with this name already exists', 400);
  }

  const room = await Room.create({
    name,
    isPrivate,
    members: Array.from(members)
  });

  // Add room to each member's list of rooms
  await User.updateMany(
    { _id: { $in: Array.from(members) } },
    { $addToSet: { rooms: room._id } }
  );

  logger.info(`Room created: ${room.name} (${room._id}) by user ${creatorId}`);
  return room;
};

/**
 * Update a room (e.g., name, add/remove members).
 * @param {string} roomId - The ID of the room to update.
 * @param {Object} updateData - Data to update.
 * @returns {Room} The updated room object.
 * @throws {ErrorResponse} If room not found.
 */
exports.updateRoom = async (roomId, updateData) => {
  const room = await Room.findByIdAndUpdate(roomId, updateData, {
    new: true,
    runValidators: true,
  }).populate({
    path: 'members',
    select: 'username email'
  });

  if (!room) {
    logger.warn(`Attempted to update non-existent room with ID: ${roomId}`);
    throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  }
  logger.info(`Room updated: ${roomId}`);
  return room;
};

/**
 * Delete a room.
 * @param {string} roomId - The ID of the room to delete.
 * @throws {ErrorResponse} If room not found.
 */
exports.deleteRoom = async (roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    logger.warn(`Attempted to delete non-existent room with ID: ${roomId}`);
    throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  }

  // Remove room from all members' room lists
  await User.updateMany(
    { _id: { $in: room.members } },
    { $pull: { rooms: room._id } }
  );

  await room.deleteOne();
  logger.info(`Room deleted: ${roomId}`);
};

/**
 * Add a user to a room.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user to add.
 * @returns {Room} The updated room object.
 * @throws {ErrorResponse} If room or user not found, or user is already a member.
 */
exports.addMemberToRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  const user = await User.findById(userId);

  if (!room) throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  if (!user) throw new ErrorResponse(`User not found with ID: ${userId}`, 404);

  if (room.members.includes(userId)) {
    throw new ErrorResponse(`User ${user.username} is already a member of room ${room.name}`, 400);
  }

  room.members.push(userId);
  await room.save();

  user.rooms.push(roomId);
  await user.save();

  logger.info(`User ${userId} added to room ${roomId}`);
  return room;
};

/**
 * Remove a user from a room.
 * @param {string} roomId - The ID of the room.
 * @param {string} userId - The ID of the user to remove.
 * @returns {Room} The updated room object.
 * @throws {ErrorResponse} If room or user not found, or user is not a member.
 */
exports.removeMemberFromRoom = async (roomId, userId) => {
  const room = await Room.findById(roomId);
  const user = await User.findById(userId);

  if (!room) throw new ErrorResponse(`Room not found with ID: ${roomId}`, 404);
  if (!user) throw new ErrorResponse(`User not found with ID: ${userId}`, 404);

  if (!room.members.includes(userId)) {
    throw new ErrorResponse(`User ${user.username} is not a member of room ${room.name}`, 400);
  }

  room.members = room.members.filter(member => member.toString() !== userId);
  await room.save();

  user.rooms = user.rooms.filter(room => room.toString() !== roomId);
  await user.save();

  logger.info(`User ${userId} removed from room ${roomId}`);
  return room;
};
```