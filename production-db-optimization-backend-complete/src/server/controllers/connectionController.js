const asyncHandler = require('express-async-handler');
const connectionService = require('../services/connectionService');
const { APIError } = require('../utils/apiError');

const createConnection = asyncHandler(async (req, res, next) => {
  const { name, host, port, user, password, database } = req.body;
  if (!name || !host || !port || !user || !password || !database) {
    throw new APIError('Please provide all connection details', 400);
  }
  const connection = await connectionService.createConnection(req.user.id, name, host, port, user, password, database);
  res.status(201).json(connection);
});

const getConnections = asyncHandler(async (req, res, next) => {
  const connections = await connectionService.getConnectionsByUserId(req.user.id);
  res.status(200).json(connections);
});

const getConnection = asyncHandler(async (req, res, next) => {
  const connection = await connectionService.getConnectionById(req.params.id);
  // Ensure the user owns this connection
  if (connection.user_id !== req.user.id) {
    throw new APIError('Not authorized to view this connection', 403);
  }
  // Sanitize password before sending
  delete connection.password;
  res.status(200).json(connection);
});

const updateConnection = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  // In a real app, only allow updating fields, not creating new ones.
  const updateData = req.body;
  const updatedConnection = await connectionService.updateConnection(id, req.user.id, updateData);
  res.status(200).json(updatedConnection);
});

const deleteConnection = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const result = await connectionService.deleteConnection(id, req.user.id);
  res.status(200).json(result);
});

// For testing connection
const testConnection = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const connection = await connectionService.getConnectionById(id);
  if (connection.user_id !== req.user.id) {
    throw new APIError('Not authorized to test this connection', 403);
  }
  // Attempt to connect and disconnect
  const pgClient = await connectionService.getCachedPgClient(id);
  // The fact that getCachedPgClient succeeded means connection is fine
  // No need to explicitly client.end() as it's cached.
  res.status(200).json({ message: 'Connection successful!' });
});


module.exports = {
  createConnection,
  getConnections,
  getConnection,
  updateConnection,
  deleteConnection,
  testConnection,
};