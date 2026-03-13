```typescript
import { DatabaseConnectionService } from '../database-connections/database-connection.service';
import { getOrCreatePgPool, closePgPool } from './pg-client-pool';
import { QueryResult } from 'pg';
import { HttpError } from '../shared/http-error';
import { IndexMetrics, QueryMetrics, TableSchema } from '../types';
import redisClient from '../shared/redis-client';
import { CacheKeys } from '../shared/enums';
import logger from '../shared/logger';

export class DatabaseMonitorService {
  constructor(private dbConnectionService: DatabaseConnectionService) {}

  private async executeQuery(connectionId: string, userId: string, query: string): Promise<QueryResult> {
    const connectionInfo = await this.dbConnectionService.getConnectionDetails(connectionId, userId);
    if (!connectionInfo) {
      throw new HttpError('Database connection details not found.', 404);
    }

    let pool;
    try {
      pool = await getOrCreatePgPool(connectionInfo);
      return await pool.query(query);
    } catch (error: any) {
      logger.error(`Error executing query on external DB (Conn ID: ${connectionId}): ${error.message}`, { query });
      // If a connection error occurs, invalidate the pool to force recreation
      if (error.code && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT' || error.severity === 'FATAL')) {
         await closePgPool(connectionId); // Close the problematic pool
      }
      throw new HttpError(`Failed to execute query on target database: ${error.message}`, 500);
    }
  }

  async getActiveQueries(connectionId: string, userId: string, minDurationMs: number = 0): Promise<QueryMetrics[]> {
    const cacheKey = `${CacheKeys.DB_METRICS}active_queries:${connectionId}:${minDurationMs}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Query for active queries, including their duration
    const query = `
      SELECT
          pid,
          application_name,
          datname,
          usename,
          client_addr,
          client_port,
          backend_start,
          xact_start,
          query_start,
          state_change,
          state,
          wait_event_type,
          wait_event,
          query,
          backend_type,
          EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000 AS duration_ms
      FROM pg_stat_activity
      WHERE state != 'idle'
        AND pid != pg_backend_pid() -- Exclude this monitoring query itself
        AND query NOT ILIKE '%pg_stat_activity%'
        ${minDurationMs > 0 ? `AND EXTRACT(EPOCH FROM (NOW() - query_start)) * 1000 > ${minDurationMs}` : ''}
      ORDER BY duration_ms DESC;
    `;
    const result = await this.executeQuery(connectionId, userId, query);

    const metrics: QueryMetrics[] = result.rows.map(row => ({
      ...row,
      backend_start: new Date(row.backend_start),
      xact_start: new Date(row.xact_start),
      query_start: new Date(row.query_start),
      state_change: new Date(row.state_change),
      duration_ms: parseFloat(row.duration_ms)
    }));

    // Cache for a short period (e.g., 5 seconds) as it's live data
    await redisClient.setEx(cacheKey, 5, JSON.stringify(metrics));
    return metrics;
  }

  async getSlowQueries(connectionId: string, userId: string, thresholdMs: number = 1000): Promise<QueryMetrics[]> {
    // This isn't strictly 'slow queries' from a log, but active queries exceeding a threshold.
    // For true slow queries, pg_stat_statements or log parsing would be needed.
    // This is a simplified approach for demonstration.
    return this.getActiveQueries(connectionId, userId, thresholdMs);
  }

  async analyzeQuery(connectionId: string, userId: string, query: string): Promise<string> {
    if (!query || !query.trim().toLowerCase().startsWith('select')) {
      throw new HttpError('Only SELECT queries can be analyzed with EXPLAIN ANALYZE.', 400);
    }
    // Prevent potentially destructive queries
    const sanitizedQuery = query.trim();
    if (sanitizedQuery.toLowerCase().startsWith('delete') ||
        sanitizedQuery.toLowerCase().startsWith('update') ||
        sanitizedQuery.toLowerCase().startsWith('insert') ||
        sanitizedQuery.toLowerCase().startsWith('drop') ||
        sanitizedQuery.toLowerCase().startsWith('alter') ||
        sanitizedQuery.toLowerCase().startsWith('truncate')) {
      throw new HttpError('DML or DDL statements are not allowed for EXPLAIN ANALYZE.', 400);
    }

    const explainQuery = `EXPLAIN (ANALYZE, VERBOSE, BUFFERS, FORMAT JSON) ${sanitizedQuery}`;
    const result = await this.executeQuery(connectionId, userId, explainQuery);
    // The result.rows will contain an array of objects, where each object has the EXPLAIN output.
    // For JSON format, it's typically one row with one column containing the JSON array.
    if (result.rows && result.rows.length > 0) {
      return JSON.stringify(result.rows[0]['QUERY PLAN'], null, 2);
    }
    return 'No EXPLAIN ANALYZE output available.';
  }

  async getIndexes(connectionId: string, userId: string): Promise<IndexMetrics[]> {
    const cacheKey = `${CacheKeys.DB_METRICS}indexes:${connectionId}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const query = `
      SELECT
          s.schemaname,
          s.relname,
          s.indexrelname,
          pg_size_pretty(pg_relation_size(s.indexrelid)) AS index_size,
          s.idx_scan,
          s.idx_tup_read,
          s.idx_tup_fetch,
          pg_get_indexdef(s.indexrelid) AS indexdef
      FROM pg_stat_user_indexes s
      JOIN pg_indexes i ON s.schemaname = i.schemaname AND s.indexrelname = i.indexname
      ORDER BY s.relname, s.indexrelname;
    `;
    const result = await this.executeQuery(connectionId, userId, query);

    const metrics: IndexMetrics[] = result.rows.map(row => ({
      schemaname: row.schemaname,
      relname: row.relname,
      indexrelname: row.indexrelname,
      idx_scan: row.idx_scan,
      idx_tup_read: row.idx_tup_read,
      idx_tup_fetch: row.idx_tup_fetch,
      indexdef: row.indexdef,
      // Add other relevant index stats if needed
    }));

    // Cache for 1 hour
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(metrics));
    return metrics;
  }

  async createIndex(connectionId: string, userId: string, tableName: string, columns: string[], indexName?: string, unique: boolean = false): Promise<string> {
    if (!tableName || !columns || columns.length === 0) {
      throw new HttpError('Table name and columns are required to create an index.', 400);
    }
    const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
    const safeColumns = columns.map(col => `"${col.replace(/"/g, '""')}"`).join(', ');
    const generatedIndexName = indexName || `${tableName}_${columns.join('_')}_idx`;
    const safeIndexName = `"${generatedIndexName.replace(/"/g, '""')}"`;

    const uniqueClause = unique ? 'UNIQUE' : '';
    const query = `CREATE ${uniqueClause} INDEX ${safeIndexName} ON ${safeTableName} (${safeColumns});`;
    await this.executeQuery(connectionId, userId, query);

    // Invalidate index cache for this connection
    await redisClient.del(`${CacheKeys.DB_METRICS}indexes:${connectionId}`);

    return `Index '${generatedIndexName}' created successfully on table '${tableName}'.`;
  }

  async dropIndex(connectionId: string, userId: string, indexName: string): Promise<string> {
    if (!indexName) {
      throw new HttpError('Index name is required to drop an index.', 400);
    }
    const safeIndexName = `"${indexName.replace(/"/g, '""')}"`;
    const query = `DROP INDEX ${safeIndexName};`;
    await this.executeQuery(connectionId, userId, query);

    // Invalidate index cache for this connection
    await redisClient.del(`${CacheKeys.DB_METRICS}indexes:${connectionId}`);

    return `Index '${indexName}' dropped successfully.`;
  }

  async getTableSchema(connectionId: string, userId: string, tableName?: string): Promise<TableSchema[]> {
    const cacheKey = tableName ? `${CacheKeys.DB_SCHEMA}table:${connectionId}:${tableName}` : `${CacheKeys.DB_SCHEMA}all_tables:${connectionId}`;
    const cachedData = await redisClient.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    let query: string;
    let params: string[] = [];

    if (tableName) {
      query = `
        SELECT
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            kcu.constraint_name IS NOT NULL AS is_primary
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu
            ON c.table_schema = kcu.table_schema
            AND c.table_name = kcu.table_name
            AND c.column_name = kcu.column_name
            AND kcu.constraint_name LIKE '%_pkey' -- Primary key constraint
        WHERE c.table_schema = 'public'
        AND c.table_name = $1
        ORDER BY c.ordinal_position;
      `;
      params.push(tableName);
    } else {
      query = `
        SELECT
            c.table_name,
            c.column_name,
            c.data_type,
            c.is_nullable,
            c.column_default,
            kcu.constraint_name IS NOT NULL AS is_primary
        FROM information_schema.columns c
        LEFT JOIN information_schema.key_column_usage kcu
            ON c.table_schema = kcu.table_schema
            AND c.table_name = kcu.table_name
            AND c.column_name = kcu.column_name
            AND kcu.constraint_name LIKE '%_pkey'
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position;
      `;
    }

    const result = await this.executeQuery(connectionId, userId, query, params);

    const tableMap = new Map<string, TableSchema>();

    result.rows.forEach(row => {
      if (!tableMap.has(row.table_name)) {
        tableMap.set(row.table_name, { tableName: row.table_name, columns: [] });
      }
      tableMap.get(row.table_name)!.columns.push({
        columnName: row.column_name,
        dataType: row.data_type,
        isNullable: row.is_nullable === 'YES',
        defaultValue: row.column_default,
        isPrimary: row.is_primary,
      });
    });

    const schemas = Array.from(tableMap.values());
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(schemas)); // Cache for 1 hour
    return schemas;
  }
}

export const databaseMonitorService = new DatabaseMonitorService(databaseConnectionService);
```