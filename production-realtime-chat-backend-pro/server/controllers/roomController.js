```javascript
const asyncHandler = require('../middleware/async');
const roomService = require('../services/roomService');
const logger = require('../config/winston');
const ErrorResponse = require('../utils/errorResponse');

// @desc      Get all rooms for the authenticated user
// @route     GET /api/v1/rooms
// @access    Private
exports.getRooms = asyncHandler(async (req, res, next) => {
  const rooms = await roomService.getRoomsForUser(req.user.id);
  res.status(200).json({ success: true, count: rooms.length, data: rooms });
});

// @desc      Get single room
// @route     GET /api/v1/rooms/:id
// @access    Private
exports.getRoom = asyncHandler(async (req, res, next) => {
  const room = await roomService.getRoomById(req.params.id, req.user.id);
  res.status(200).json({ success: true, data: room });
});

// @desc      Create new room
// @route     POST /api/v1/rooms
// @access    Private
exports.createRoom = asyncHandler(async (req, res, next) => {
  const { name, isPrivate, members } = req.body;

  if (!name) {
    return next(new ErrorResponse('Please provide a room name', 400));
  }

  // Ensure creator is added to members
  const newMembers = members ? [...new Set([req.user.id, ...members])] : [req.user.id];

  const room = await roomService.createRoom(name, isPrivate || false, newMembers, req.user.id);
  res.status(201).json({ success: true, data: room });
});

// @desc      Update room
// @route     PUT /api/v1/rooms/:id
// @access    Private (Admin or Room creator/moderator)
exports.updateRoom = asyncHandler(async (req, res, next) => {
  // Implement authorization logic here (e.g., check if req.user is room creator/admin)
  const { name, isPrivate } = req.body; // Allow changing name and private status
  const updateData = { name, isPrivate }; // Can add/remove members via separate routes

  const room = await roomService.updateRoom(req.params.id, updateData);
  res.status(200).json({ success: true, data: room });
});

// @desc      Delete room
// @route     DELETE /api/v1/rooms/:id
// @access    Private (Admin or Room creator)
exports.deleteRoom = asyncHandler(async (req, res, next) => {
  // Implement authorization logic here
  await roomService.deleteRoom(req.params.id);
  res.status(200).json({ success: true, data: {} });
});

// @desc      Add member to room
// @route     PUT /api/v1/rooms/:id/join
// @access    Private
exports.addMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body; // Can be current user or an admin adding another user
  const userToAdd = userId || req.user.id; // Defaults to current user

  const room = await roomService.addMemberToRoom(req.params.id, userToAdd);
  res.status(200).json({ success: true, data: room, message: 'User joined room successfully' });
});

// @desc      Remove member from room
// @route     PUT /api/v1/rooms/:id/leave
// @access    Private
exports.removeMember = asyncHandler(async (req, res, next) => {
  const { userId } = req.body; // Can be current user leaving or an admin removing another user
  const userToRemove = userId || req.user.id; // Defaults to current user

  const room = await roomService.removeMemberFromRoom(req.params.id, userToRemove);
  res.status(200).json({ success: true, data: room, message: 'User left room successfully' });
});
```