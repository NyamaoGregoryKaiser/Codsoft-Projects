const { getCachedPgClient } = require('./connectionService');
const logger = require('../utils/logger');
const { APIError } = require('../utils/apiError');

async function getTables(connectionId) {
  let pgClient;
  try {
    pgClient = await getCachedPgClient(connectionId);
    const result = await pgClient.query(`
      SELECT tablename, schemaname
      FROM pg_catalog.pg_tables
      WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema';
    `);
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching tables for connection ${connectionId}: ${error.message}`);
    throw new APIError(`Failed to fetch tables: ${error.message}`, 500);
  }
}

async function getTableDetails(connectionId, schemaName, tableName) {
  let pgClient;
  try {
    pgClient = await getCachedPgClient(connectionId);

    // Columns
    const columnsResult = await pgClient.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position;
    `, [schemaName, tableName]);

    // Indexes
    const indexesResult = await pgClient.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = $1 AND tablename = $2;
    `, [schemaName, tableName]);

    // Constraints (primary keys, foreign keys, unique)
    const constraintsResult = await pgClient.query(`
      SELECT conname AS constraint_name,
             pg_get_constraintdef(c.oid) AS constraint_definition,
             contype AS constraint_type
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      JOIN pg_namespace n ON t.relnamespace = n.oid
      WHERE n.nspname = $1 AND t.relname = $2;
    `, [schemaName, tableName]);

    return {
      tableName,
      schemaName,
      columns: columnsResult.rows,
      indexes: indexesResult.rows,
      constraints: constraintsResult.rows.map(row => ({
        name: row.constraint_name,
        definition: row.constraint_definition,
        type: row.constraint_type === 'p' ? 'PRIMARY KEY' :
              row.constraint_type === 'f' ? 'FOREIGN KEY' :
              row.constraint_type === 'u' ? 'UNIQUE' : row.constraint_type,
      })),
    };
  } catch (error) {
    logger.error(`Error fetching table details for ${schemaName}.${tableName} (connection ${connectionId}): ${error.message}`);
    throw new APIError(`Failed to fetch table details: ${error.message}`, 500);
  }
}

module.exports = {
  getTables,
  getTableDetails,
};