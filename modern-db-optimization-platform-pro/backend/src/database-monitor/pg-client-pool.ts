```typescript
import { Pool } from 'pg';
import { DbConnectionInfo } from '../types';
import logger from '../shared/logger';
import { HttpError } from '../shared/http-error';

// A map to store connection pools for each database connection ID
const clientPools: Map<string, Pool> = new Map();

export async function getOrCreatePgPool(connectionInfo: DbConnectionInfo): Promise<Pool> {
  const { id, host, port, database, user, password } = connectionInfo;

  if (clientPools.has(id)) {
    return clientPools.get(id)!;
  }

  const pool = new Pool({
    user: user,
    host: host,
    database: database,
    password: password,
    port: port,
    max: 10, // Max number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 10000, // How long to wait before throwing an error on connection
  });

  pool.on('error', (err: Error) => {
    logger.error(`PostgreSQL pool error for connection ${id} (${database}):`, err);
    // Remove the pool if it encounters a fatal error, forcing re-creation on next request
    clientPools.delete(id);
  });

  pool.on('connect', (client) => {
    logger.debug(`New client connected to ${database} for connection ID: ${id}`);
  });

  pool.on('remove', (client) => {
    logger.debug(`Client removed from pool for ${database} connection ID: ${id}`);
  });

  // Test connection to ensure it's valid before adding to map
  try {
    const client = await pool.connect();
    client.release();
    clientPools.set(id, pool);
    logger.info(`New PostgreSQL pool created and validated for connection ${id} (${database})`);
    return pool;
  } catch (error: any) {
    logger.error(`Failed to establish initial connection for ${id} (${database}): ${error.message}`);
    // Clean up the pool if initial connection fails
    await pool.end();
    throw new HttpError(`Failed to connect to target database: ${error.message}`, 500);
  }
}

export async function closeAllPgPools(): Promise<void> {
  for (const [id, pool] of clientPools.entries()) {
    logger.info(`Closing PostgreSQL pool for connection ID: ${id}`);
    await pool.end();
  }
  clientPools.clear();
  logger.info('All PostgreSQL pools closed.');
}

// Function to close a specific pool if a connection becomes invalid
export async function closePgPool(connectionId: string): Promise<void> {
  const pool = clientPools.get(connectionId);
  if (pool) {
    logger.warn(`Closing specific PostgreSQL pool for connection ID: ${connectionId} due to error.`);
    await pool.end();
    clientPools.delete(connectionId);
  }
}
```