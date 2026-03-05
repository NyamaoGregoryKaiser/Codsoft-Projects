const knex = require('../db/knex');
const { encrypt, decrypt } = require('../utils/encryption');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');
const NodeCache = require('node-cache');

// Cache for active database connections (key: connectionId, value: pg.Client instance)
const dbClientCache = new NodeCache({ stdTTL: 3600, checkperiod: 120 }); // TTL 1 hour

const CONNECTION_TABLE = 'connections';

// Function to establish a new PostgreSQL client connection
async function createPgClient(connectionDetails) {
  const { host, port, user, password, database } = connectionDetails;
  const { Client } = require('pg'); // Lazy load pg to avoid global dependency if not used
  const client = new Client({
    host,
    port,
    user,
    password: decrypt(password), // Decrypt password
    database,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    await client.connect();
    logger.info(`Successfully connected to target DB: ${connectionDetails.name}`);
    return client;
  } catch (error) {
    logger.error(`Failed to connect to target DB ${connectionDetails.name}: ${error.message}`);
    throw new APIError(`Failed to connect to target database: ${error.message}`, 500);
  }
}

// Get or create a cached client connection
async function getCachedPgClient(connectionId) {
  let client = dbClientCache.get(connectionId);
  if (client) {
    // Ping client to check if still alive (simple query)
    try {
      await client.query('SELECT 1');
      return client;
    } catch (e) {
      logger.warn(`Cached client for ${connectionId} is stale or disconnected. Reconnecting.`, e.message);
      dbClientCache.del(connectionId); // Remove stale client
      client = null;
    }
  }

  // If not in cache or stale, retrieve details from DB and create new client
  const connection = await getConnectionById(connectionId);
  if (!connection) {
    throw new APIError('Database connection details not found.', 404);
  }
  client = await createPgClient(connection);
  dbClientCache.set(connectionId, client);
  return client;
}

const createConnection = async (userId, name, host, port, user, password, database) => {
  try {
    const encryptedPassword = encrypt(password);
    const [connection] = await knex(CONNECTION_TABLE).insert({
      user_id: userId,
      name,
      host,
      port,
      user,
      password: encryptedPassword,
      database,
    }).returning('*');
    // Sanitize output - never return encrypted password
    delete connection.password;
    return connection;
  } catch (error) {
    logger.error(`Error creating connection for user ${userId}: ${error.message}`);
    throw new APIError('Could not create connection', 500);
  }
};

const getConnectionsByUserId = async (userId) => {
  try {
    const connections = await knex(CONNECTION_TABLE).select(
      'id', 'name', 'host', 'port', 'user', 'database', 'created_at', 'updated_at'
    ).where({ user_id: userId });
    return connections;
  } catch (error) {
    logger.error(`Error fetching connections for user ${userId}: ${error.message}`);
    throw new APIError('Could not retrieve connections', 500);
  }
};

const getConnectionById = async (connectionId) => {
  try {
    const connection = await knex(CONNECTION_TABLE).select('*').where({ id: connectionId }).first();
    if (!connection) {
      throw new APIError('Connection not found', 404);
    }
    return connection;
  } catch (error) {
    logger.error(`Error fetching connection ${connectionId}: ${error.message}`);
    throw new APIError('Could not retrieve connection', 500);
  }
};

const updateConnection = async (connectionId, userId, updateData) => {
  try {
    // Encrypt password if it's being updated
    if (updateData.password) {
      updateData.password = encrypt(updateData.password);
    }
    const [updatedConnection] = await knex(CONNECTION_TABLE)
      .where({ id: connectionId, user_id: userId })
      .update(updateData)
      .returning('*');

    if (!updatedConnection) {
      throw new APIError('Connection not found or not authorized', 404);
    }
    // Invalidate cached client if connection details change
    dbClientCache.del(connectionId);
    delete updatedConnection.password;
    return updatedConnection;
  } catch (error) {
    logger.error(`Error updating connection ${connectionId}: ${error.message}`);
    throw new APIError('Could not update connection', 500);
  }
};

const deleteConnection = async (connectionId, userId) => {
  try {
    const deletedCount = await knex(CONNECTION_TABLE).where({ id: connectionId, user_id: userId }).del();
    if (deletedCount === 0) {
      throw new APIError('Connection not found or not authorized', 404);
    }
    // Remove from cache
    const client = dbClientCache.get(connectionId);
    if (client) {
      await client.end().catch(e => logger.error(`Error closing cached client for ${connectionId}: ${e.message}`));
      dbClientCache.del(connectionId);
    }
    return { message: 'Connection deleted successfully' };
  } catch (error) {
    logger.error(`Error deleting connection ${connectionId}: ${error.message}`);
    throw new APIError('Could not delete connection', 500);
  }
};

module.exports = {
  createConnection,
  getConnectionsByUserId,
  getConnectionById,
  updateConnection,
  deleteConnection,
  getCachedPgClient,
};